const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const OWNER = "11111111-1111-4111-8111-111111111111";
const STAFF = "22222222-2222-4222-8222-222222222222";
const sourceRoot = path.resolve(__dirname, "../src");
const golQueue = "instagram_scheduled_posts";
const drefQueue = "dref_wen_instagram_scheduled_posts";

// Run the actual route handlers with isolated credentials, mocked external
// services, and a separate module graph for every scenario. No live APIs run.
function harness(options = {}) {
  const events = [];
  const env = {
    NODE_ENV: "production",
    FACEBOOK_ACCESS_TOKEN: "gol-facebook-token",
    FACEBOOK_PAGE_ID: "gol-page",
    INSTAGRAM_ACCESS_TOKEN: "gol-instagram-token",
    INSTAGRAM_BUSINESS_ACCOUNT_ID: "gol-instagram",
    DREF_WEN_SCHEDULER_USER_ID: OWNER,
    DREF_WEN_FACEBOOK_ACCESS_TOKEN: "dref-facebook-token",
    DREF_WEN_INSTAGRAM_ACCESS_TOKEN: "dref-instagram-token",
    CRON_SECRET: "test-cron-secret",
    ...options.env,
  };
  const user = options.user === undefined ? { id: OWNER } : options.user;
  const resultFor = (table, operation) => {
    if (options.query) return options.query(table, operation);
    if (operation === "lookup") return { data: { id: "post", status: "queued" }, error: null };
    if (operation === "insert" || operation === "update") return { data: [{ id: "post" }], error: null };
    return { data: [], error: null };
  };
  const db = {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table) {
      let operation = "select";
      const query = {};
      for (const method of ["select", "eq", "not", "in", "order", "limit", "insert", "update", "upsert"]) {
        query[method] = (...args) => {
          events.push({ kind: "db", table, method, args });
          if (["insert", "update", "upsert"].includes(method)) operation = method;
          return query;
        };
      }
      query.maybeSingle = async () => resultFor(table, "lookup");
      query.then = (resolve, reject) => Promise.resolve(resultFor(table, operation)).then(resolve, reject);
      return query;
    },
    rpc: async (name, args) => {
      events.push({ kind: "rpc", name, args });
      return options.rpc ? options.rpc(name, args) : { data: [], error: null };
    },
    storage: {
      createBucket: async () => ({ data: {}, error: null }),
      from: () => ({
        upload: async (name) => { events.push({ kind: "upload", name }); return { error: null }; },
        getPublicUrl: (name) => ({ data: { publicUrl: `https://images.example/${name}` } }),
      }),
    },
  };
  const fetchMock = async (input, init = {}) => {
    const url = new URL(input);
    const event = { kind: "fetch", url, method: init.method || "GET", body: init.body };
    events.push(event);
    if (options.fetch) return options.fetch(event);
    if (url.pathname.endsWith("/scheduled_posts")) return Response.json({ data: [{ id: "dref-post", message: "Scheduled" }] });
    if (url.pathname.endsWith("/media") && event.method === "GET") return Response.json({ data: [] });
    if (url.pathname.endsWith("/media")) return Response.json({ id: "container" });
    if (url.pathname.endsWith("/media_publish")) return Response.json({ id: "published-media" });
    return Response.json({ id: "photo", success: true });
  };
  const context = vm.createContext({
    process: { env }, fetch: fetchMock, console, Buffer,
    URL, URLSearchParams, Request, Response, Headers, FormData, File, Blob,
    crypto: globalThis.crypto, setTimeout, clearTimeout,
  });
  const cache = new Map();
  function load(filename) {
    const full = path.resolve(filename);
    if (cache.has(full)) return cache.get(full).exports;
    const module = { exports: {} };
    cache.set(full, module);
    const js = ts.transpileModule(fs.readFileSync(full, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
      fileName: full,
    }).outputText;
    const customRequire = (name) => {
      if (name === "next/server") return { NextResponse: { json: (body, init) => Response.json(body, init) } };
      if (name === "@/utils/supabase/server") return { createClient: async () => db };
      if (name === "@supabase/supabase-js") return { createClient: () => db };
      if (name.startsWith("@/")) return load(path.join(sourceRoot, name.slice(2)) + ".ts");
      if (name.startsWith(".")) return load(path.resolve(path.dirname(full), name) + ".ts");
      throw new Error(`Unexpected dependency: ${name}`);
    };
    const run = new vm.Script(`(function(require, module, exports) { ${js}\n})`, { filename: full }).runInContext(context);
    run(customRequire, module, module.exports);
    return module.exports;
  }
  return { events, env, load: (name) => load(path.join(sourceRoot, name)) };
}

function scheduleRequest(account, platforms = ["facebook", "instagram"], query = "") {
  const form = new FormData();
  if (account !== undefined) form.set("account", account);
  form.set("message", "A Dref Wen story");
  form.set("scheduledTimes", JSON.stringify([new Date(Date.now() + 3600000).toISOString()]));
  form.set("platforms", JSON.stringify(platforms));
  form.set("image", new File(["image"], "book.jpg", { type: "image/jpeg" }));
  return new Request(`https://scheduler.example/api/social/schedule${query}`, { method: "POST", body: form });
}

test("Meta returns to an isolated page without interpreting a project login", async () => {
  const h = harness({ user: null });
  const res = await h.load("app/auth/meta/callback/route.ts").GET(
    new Request("https://scheduler.example/auth/meta/callback?error_description=example#access_token=foreign-token")
  );
  assert.equal(res.status, 200);
  assert.match(res.headers.get("content-type"), /^text\/html/);
  assert.equal(res.headers.get("cache-control"), "no-store");
  assert.equal(res.headers.get("referrer-policy"), "no-referrer");
  assert.match(res.headers.get("content-security-policy"), /default-src 'none'/);
  assert.equal(res.headers.get("set-cookie"), null);
  const html = await res.text();
  assert.match(html, /href="\/dref-wen"/);
  assert.doesNotMatch(html, /<script|<iframe|<form|_next\/|foreign-token|error_description/i);
  assert.equal(h.events.length, 0);
});

test("Dref Wen scheduling uses its Page token, upload path, metadata and queue", async () => {
  const h = harness();
  const res = await h.load("app/api/social/schedule/route.ts").POST(scheduleRequest("dref-wen"));
  assert.equal(res.status, 200);
  const calls = h.events.filter((e) => e.kind === "fetch");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url.pathname, "/v22.0/681151585558387/photos");
  assert.equal(calls[0].body.get("access_token"), "dref-facebook-token");
  assert.match(h.events.find((e) => e.kind === "upload").name, /^dref-wen\/instagram\//);
  const insert = h.events.find((e) => e.kind === "db" && e.method === "insert");
  assert.equal(insert.table, drefQueue);
  assert.equal(insert.args[0][0].created_by, OWNER);
  const metadata = h.events.find((e) => e.kind === "db" && e.method === "upsert");
  assert.equal(metadata.table, "dref_wen_facebook_scheduled_post_images");
  assert.equal(metadata.args[0][0].post_id, "681151585558387_photo");
  assert.ok(!h.events.some((e) => e.table === golQueue));
});

test("legacy scheduling requests retain the Gôl destination", async () => {
  const h = harness();
  const res = await h.load("app/api/social/schedule/route.ts").POST(scheduleRequest(undefined, ["facebook"]));
  assert.equal(res.status, 200);
  const call = h.events.find((e) => e.kind === "fetch");
  assert.equal(call.url.pathname, "/v22.0/gol-page/photos");
  assert.equal(call.body.get("access_token"), "gol-facebook-token");
});

test("missing Dref Wen credentials cannot fall back to Gôl credentials", async () => {
  const h = harness({ env: { DREF_WEN_FACEBOOK_ACCESS_TOKEN: undefined, DREF_WEN_INSTAGRAM_ACCESS_TOKEN: undefined } });
  const res = await h.load("app/api/social/schedule/route.ts").POST(scheduleRequest("dref-wen"));
  assert.equal(res.status, 207);
  const body = await res.json();
  assert.ok(body.results.facebook[0].error);
  assert.ok(body.results.instagram[0].error);
  assert.equal(h.events.length, 0);
});

for (const [name, options, request, status] of [
  ["signed out", { user: null }, () => scheduleRequest("dref-wen"), 401],
  ["another staff member", { user: { id: STAFF } }, () => scheduleRequest("dref-wen"), 403],
  ["no configured owner", { env: { DREF_WEN_SCHEDULER_USER_ID: undefined } }, () => scheduleRequest("dref-wen"), 403],
  ["unknown account", {}, () => scheduleRequest("dreff-wen"), 400],
  ["empty account", {}, () => scheduleRequest(""), 400],
  ["conflicting destinations", {}, () => scheduleRequest("dref-wen", ["facebook"], "?account=gol"), 400],
]) {
  test(`${name} is rejected before scheduling side effects`, async () => {
    const h = harness(options);
    const res = await h.load("app/api/social/schedule/route.ts").POST(request());
    assert.equal(res.status, status);
    assert.equal(h.events.length, 0);
  });
}

test("Dref Wen's listing, edits and cancellation use its queue and creator filter", async () => {
  for (const method of ["GET", "PATCH", "DELETE"]) {
    const h = harness();
    const route = h.load("app/api/instagram/scheduled-posts/route.ts");
    const res = await route[method](new Request("https://scheduler.example/api/instagram/scheduled-posts?account=dref-wen&id=post", {
      method,
      ...(method === "PATCH" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ caption: "Updated" }) } : {}),
    }));
    assert.equal(res.status, 200, method);
    const queries = h.events.filter((e) => e.kind === "db");
    assert.ok(queries.length > 0);
    assert.ok(queries.every((e) => e.table === drefQueue));
    assert.ok(queries.some((e) => e.method === "eq" && e.args[0] === "created_by" && e.args[1] === OWNER));
    if (method !== "GET") assert.ok(queries.some((e) => e.method === "in" && e.args[0] === "status"));
  }
});

test("a Gôl Facebook post cannot be edited or cancelled through Dref Wen", async () => {
  for (const method of ["PATCH", "DELETE"]) {
    const h = harness();
    const route = h.load("app/api/facebook/scheduled-posts/route.ts");
    const res = await route[method](new Request("https://scheduler.example/api/facebook/scheduled-posts?account=dref-wen&id=gol-post", {
      method,
      ...(method === "PATCH" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message: "Updated" }) } : {}),
    }));
    assert.equal(res.status, 404);
    const calls = h.events.filter((e) => e.kind === "fetch");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url.pathname, "/v22.0/681151585558387/scheduled_posts");
    assert.equal(calls[0].url.searchParams.get("access_token"), "dref-facebook-token");
    assert.equal(calls[0].method, "GET");
  }
});

test("all scheduled-post routes reject staff access to Dref Wen", async () => {
  for (const name of ["facebook", "instagram"]) {
    for (const method of ["GET", "PATCH", "DELETE"]) {
      const h = harness({ user: { id: STAFF } });
      const res = await h.load(`app/api/${name}/scheduled-posts/route.ts`)[method](new Request(`https://scheduler.example/api/${name}/scheduled-posts?account=dref-wen&id=post`, { method }));
      assert.equal(res.status, 403);
      assert.equal(h.events.length, 0);
    }
  }
});

test("Dref Wen cannot be sent to the Gôl-only legacy Facebook endpoint", async () => {
  const h = harness();
  const res = await h.load("app/api/facebook/schedule/route.ts").POST(scheduleRequest("dref-wen", ["facebook"]));
  assert.equal(res.status, 400);
  assert.equal(h.events.length, 0);
});

function dueJob(id = "job", created_by = OWNER) {
  return { id, created_by, caption: "Same caption on both brands", image_url: "https://images.example/book.jpg", scheduled_for: new Date(Date.now() - 60000).toISOString(), attempts: 1 };
}

test("the automated worker publishes each brand with its own Instagram credentials", async () => {
  const h = harness({ rpc: (name) => ({ data: [dueJob(name)], error: null }) });
  const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled", {
    method: "POST", headers: { authorization: "Bearer test-cron-secret" },
  }));
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.published, 2);
  const claims = h.events.filter((e) => e.kind === "rpc");
  assert.equal(claims.length, 2);
  assert.equal(claims[1].name, "claim_due_dref_wen_instagram_scheduled_posts");
  assert.equal(claims[1].args.p_owner_id, OWNER);
  const writes = h.events.filter((e) => e.kind === "fetch" && e.url.pathname.endsWith("/media_publish"));
  assert.equal(writes.length, 2);
  assert.equal(writes[0].url.pathname, "/v22.0/gol-instagram/media_publish");
  assert.equal(writes[0].body.get("access_token"), "gol-instagram-token");
  assert.equal(writes[1].url.pathname, "/v22.0/17841425739521098/media_publish");
  assert.equal(writes[1].body.get("access_token"), "dref-instagram-token");
  assert.ok(h.events.some((e) => e.kind === "db" && e.table === drefQueue && e.method === "update"));
});

test("the manual Dref Wen worker claims only the Dref Wen queue", async () => {
  const h = harness();
  const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled?account=dref-wen", { method: "POST" }));
  assert.equal(res.status, 200);
  const claims = h.events.filter((e) => e.kind === "rpc");
  assert.equal(claims.length, 1);
  assert.equal(claims[0].name, "claim_due_dref_wen_instagram_scheduled_posts");
  assert.equal(claims[0].args.p_owner_id, OWNER);
});

test("an unavailable Dref Wen queue does not strand claimed Gôl posts", async () => {
  const h = harness({ rpc: (name) => name.includes("dref_wen") ? { error: { message: "Queue missing" } } : { data: [dueJob()], error: null } });
  const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled", {
    method: "POST", headers: { authorization: "Bearer test-cron-secret" },
  }));
  const body = await res.json();
  assert.equal(res.status, 500);
  assert.equal(body.published, 1);
  assert.match(body.error, /Dref Wen/);
});

test("duplicate-check failures prevent publishing an uncertain post", async () => {
  const h = harness({
    rpc: () => ({ data: [dueJob()], error: null }),
    fetch: () => Response.json({ error: { message: "Cannot check recent media" } }, { status: 503 }),
  });
  const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled?account=dref-wen", { method: "POST" }));
  assert.equal((await res.json()).failed, 1);
  assert.ok(!h.events.some((e) => e.kind === "fetch" && e.method === "POST"));
});

test("the Dref Wen worker rejects a queued post belonging to someone else", async () => {
  const h = harness({ rpc: () => ({ data: [dueJob("wrong-owner", STAFF)], error: null }) });
  const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled?account=dref-wen", { method: "POST" }));
  assert.equal((await res.json()).failed, 1);
  assert.ok(!h.events.some((e) => e.kind === "fetch"));
});

test("staff and signed-out callers cannot process Dref Wen's queue", async () => {
  for (const [user, status] of [[{ id: STAFF }, 403], [null, 401]]) {
    const h = harness({ user });
    const res = await h.load("app/api/instagram/process-scheduled/route.ts").POST(new Request("https://scheduler.example/api/instagram/process-scheduled?account=dref-wen", { method: "POST" }));
    assert.equal(res.status, status);
    assert.equal(h.events.length, 0);
  }
});
