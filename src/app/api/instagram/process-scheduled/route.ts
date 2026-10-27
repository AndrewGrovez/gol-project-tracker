import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import {
  findRecentInstagramMediaByCaption,
  getInstagramPublishingConfigError,
  publishInstagramImageNow,
} from "@/lib/social/instagram-publishing";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { SOCIAL_ACCOUNT_KEYS } from "@/lib/social/account-types";
import { getSocialAccountConfig, parseSocialAccountKey, requireSocialAccount, socialAccountErrorResponse, type SocialAccountConfig } from "@/lib/social/accounts";

export const maxDuration = 60;

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
  created_by: string;
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

async function getAuthorization(request: Request): Promise<{ kind: "automation" } | { kind: "user"; userId: string } | null> {
  const authHeader = request.headers.get("authorization");
  const expectedCronHeader = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : null;

  if (expectedCronHeader && authHeader === expectedCronHeader) {
    return { kind: "automation" };
  }

  if (await isValidGitHubActionsToken(bearerToken)) {
    return { kind: "automation" };
  }

  const supabase = await createUserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return { kind: "user", userId: user.id };
  }

  return null;
}

async function handleRequest(request: Request) {
  const authorization = await getAuthorization(request);
  if (!authorization) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accountValue = new URL(request.url).searchParams.get("account");
  let accounts: SocialAccountConfig[];
  try {
    if (authorization.kind === "user") {
      accounts = [requireSocialAccount(accountValue, authorization.userId)];
    } else if (accountValue !== null) {
      accounts = [getSocialAccountConfig(parseSocialAccountKey(accountValue))];
    } else {
      accounts = SOCIAL_ACCOUNT_KEYS.map(getSocialAccountConfig).filter(
        (account) => !getInstagramPublishingConfigError(account.key) && (account.key === "gol" || account.ownerId)
      );
    }
    for (const account of accounts) {
      const configError = getInstagramPublishingConfigError(account.key);
      if (configError || (account.key === "dref-wen" && !account.ownerId)) {
        return NextResponse.json({ error: configError || "Dref Wen's scheduler owner has not been configured." }, { status: 503 });
      }
    }
    if (accounts.length === 0) return NextResponse.json({ error: "No Instagram publishing accounts are configured." }, { status: 503 });
  } catch (error) {
    return socialAccountErrorResponse(error);
  }

  const batchSizeRaw = new URL(request.url).searchParams.get("limit");
  const parsedBatchSize = Number.parseInt(batchSizeRaw ?? `${DEFAULT_BATCH_SIZE}`, 10);
  const batchSize = Number.isFinite(parsedBatchSize)
    ? Math.max(1, Math.min(parsedBatchSize, MAX_BATCH_SIZE))
    : DEFAULT_BATCH_SIZE;

  const supabase = createServiceRoleClient();
  const jobs: Array<{ job: ClaimedInstagramJob; account: SocialAccountConfig }> = [];
  const claimErrors: string[] = [];
  for (const account of accounts) {
    const remaining = batchSize - jobs.length;
    if (remaining <= 0) break;
    const { data, error } = await supabase.rpc(account.instagramClaimFunction, {
      p_limit: remaining,
      ...(account.key === "dref-wen" ? { p_owner_id: account.ownerId } : {}),
    });
    if (error) {
      claimErrors.push(`${account.label}: failed to claim due Instagram jobs: ${error.message}`);
      continue;
    }
    const claimed = Array.isArray(data) ? (data as ClaimedInstagramJob[]) : [];
    jobs.push(...claimed.map((job) => ({ job, account })));
  }

  if (jobs.length === 0) {
    return NextResponse.json({
      success: claimErrors.length === 0,
      processed: 0,
      published: 0,
      failed: 0,
      results: [],
      ...(claimErrors.length ? { error: claimErrors.join(" ") } : {}),
    }, { status: claimErrors.length ? 500 : 200 });
  }

  let published = 0;
  let failed = 0;
  const results: Array<{ id: string; account: string; scheduledFor: string; status: string; error?: string }> = [];

  for (const { job, account } of jobs) {
    try {
      if (account.key === "dref-wen" && job.created_by !== account.ownerId) {
        throw new Error("The queued post does not belong to Dref Wen's scheduler owner.");
      }
      const existingMedia = await findRecentInstagramMediaByCaption(
        job.caption,
        job.scheduled_for,
        account.key
      );

      if (existingMedia) {
        const { error: existingUpdateError } = await supabase
          .from(account.instagramQueueTable)
          .update({
            status: "published",
            published_at: existingMedia.timestamp
              ? new Date(existingMedia.timestamp).toISOString()
              : new Date().toISOString(),
            instagram_media_id: existingMedia.id,
            error_message: null,
          })
          .eq("id", job.id);

        if (existingUpdateError) {
          throw new Error(
            `Instagram post already exists but job update failed: ${existingUpdateError.message}`
          );
        }

        published += 1;
        results.push({
          id: job.id,
          account: account.key,
          scheduledFor: job.scheduled_for,
          status: "published",
        });
        continue;
      }

      const mediaId = await publishInstagramImageNow(job.caption, job.image_url, account.key);

      const { error: updateError } = await supabase
        .from(account.instagramQueueTable)
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
        account: account.key,
        scheduledFor: job.scheduled_for,
        status: "published",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Instagram publish failed.";

      await supabase
        .from(account.instagramQueueTable)
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", job.id);

      failed += 1;
      results.push({
        id: job.id,
        account: account.key,
        scheduledFor: job.scheduled_for,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    success: failed === 0 && claimErrors.length === 0,
    processed: jobs.length,
    published,
    failed,
    results,
    ...(claimErrors.length ? { error: claimErrors.join(" ") } : {}),
  }, { status: claimErrors.length ? 500 : 200 });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
