import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import {
  getInstagramPublishingConfigError,
  publishInstagramImageNow,
} from "@/lib/social/instagram-publishing";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;
const GITHUB_ACTIONS_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_ACTIONS_OIDC_JWKS_URL = `${GITHUB_ACTIONS_OIDC_ISSUER}/.well-known/jwks`;
const GITHUB_ACTIONS_OIDC_AUDIENCE =
  process.env.GITHUB_ACTIONS_OIDC_AUDIENCE ?? "instagram-scheduler";
const GITHUB_ACTIONS_OIDC_REPOSITORY =
  process.env.GITHUB_ACTIONS_OIDC_REPOSITORY ?? "AndrewGrovez/gol-project-tracker";
const GITHUB_ACTIONS_OIDC_REF =
  process.env.GITHUB_ACTIONS_OIDC_REF ?? "refs/heads/main";
const GITHUB_ACTIONS_JWKS_CACHE_TTL_MS = 60 * 60 * 1000;

interface ClaimedInstagramJob {
  id: string;
  caption: string;
  image_url: string;
  scheduled_for: string;
  attempts: number;
}

interface GitHubJwk extends JsonWebKey {
  alg?: string;
  kid?: string;
  kty?: string;
  use?: string;
}

interface GitHubActionsClaims {
  aud?: string | string[];
  exp?: number;
  iss?: string;
  nbf?: number;
  ref?: string;
  repository?: string;
}

let cachedGitHubJwks:
  | {
      expiresAt: number;
      keys: GitHubJwk[];
    }
  | null = null;

const createServiceRoleClient = () =>
  createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

function parseJwtSection<T>(value: string): T | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

async function getGitHubActionsJwks() {
  if (cachedGitHubJwks && cachedGitHubJwks.expiresAt > Date.now()) {
    return cachedGitHubJwks.keys;
  }

  const response = await fetch(GITHUB_ACTIONS_OIDC_JWKS_URL, {
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const data = (await response.json()) as { keys?: GitHubJwk[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];

  cachedGitHubJwks = {
    keys,
    expiresAt: Date.now() + GITHUB_ACTIONS_JWKS_CACHE_TTL_MS,
  };

  return keys;
}

async function isValidGitHubActionsToken(token: string | null) {
  if (!token) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = parseJwtSection<{ alg?: string; kid?: string }>(encodedHeader);
  const claims = parseJwtSection<GitHubActionsClaims>(encodedPayload);

  if (!header || !claims || header.alg !== "RS256" || !header.kid) {
    return false;
  }

  const keys = await getGitHubActionsJwks();
  const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
  if (!jwk) {
    return false;
  }

  const key = await crypto.subtle.importKey(
    "jwk",
    jwk,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["verify"]
  );

  const isValid = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    Buffer.from(encodedSignature, "base64url"),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`)
  );

  if (!isValid) {
    return false;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];

  return (
    claims.iss === GITHUB_ACTIONS_OIDC_ISSUER &&
    audiences.includes(GITHUB_ACTIONS_OIDC_AUDIENCE) &&
    claims.repository === GITHUB_ACTIONS_OIDC_REPOSITORY &&
    claims.ref === GITHUB_ACTIONS_OIDC_REF &&
    typeof claims.exp === "number" &&
    claims.exp > nowSeconds &&
    (typeof claims.nbf !== "number" || claims.nbf <= nowSeconds)
  );
}

async function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedCronHeader = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (expectedCronHeader && authHeader === expectedCronHeader) {
    return true;
  }

  if (await isValidGitHubActionsToken(bearerToken)) {
    return true;
  }

  const supabase = await createUserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return true;
  }

  return !expectedCronHeader && process.env.NODE_ENV !== "production";
}

async function handleRequest(request: Request) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configError = getInstagramPublishingConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const batchSizeRaw = new URL(request.url).searchParams.get("limit");
  const parsedBatchSize = Number.parseInt(batchSizeRaw ?? `${DEFAULT_BATCH_SIZE}`, 10);
  const batchSize = Number.isFinite(parsedBatchSize)
    ? Math.max(1, Math.min(parsedBatchSize, MAX_BATCH_SIZE))
    : DEFAULT_BATCH_SIZE;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("claim_due_instagram_scheduled_posts", {
    p_limit: batchSize,
  });

  if (error) {
    return NextResponse.json(
      { error: `Failed to claim due Instagram jobs: ${error.message}` },
      { status: 500 }
    );
  }

  const jobs = Array.isArray(data) ? (data as ClaimedInstagramJob[]) : [];

  if (jobs.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      published: 0,
      failed: 0,
      results: [],
    });
  }

  let published = 0;
  let failed = 0;
  const results: Array<{ id: string; scheduledFor: string; status: string; error?: string }> = [];

  for (const job of jobs) {
    try {
      const mediaId = await publishInstagramImageNow(job.caption, job.image_url);

      const { error: updateError } = await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          instagram_media_id: mediaId ?? null,
          error_message: null,
        })
        .eq("id", job.id);

      if (updateError) {
        throw new Error(`Publish succeeded but job update failed: ${updateError.message}`);
      }

      published += 1;
      results.push({
        id: job.id,
        scheduledFor: job.scheduled_for,
        status: "published",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Instagram publish failed.";

      await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", job.id);

      failed += 1;
      results.push({
        id: job.id,
        scheduledFor: job.scheduled_for,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    success: failed === 0,
    processed: jobs.length,
    published,
    failed,
    results,
  });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
