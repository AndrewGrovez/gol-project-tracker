import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { SOCIAL_ACCOUNT_KEYS, type SocialAccountKey, type SocialAccountSummary } from "./account-types";

export interface SocialAccountConfig {
  key: SocialAccountKey;
  label: string;
  href: string;
  ownerId?: string;
  facebookAccessToken?: string;
  facebookPageId?: string;
  instagramAccessToken?: string;
  instagramAccountId?: string;
  instagramQueueTable: string;
  instagramClaimFunction: string;
  facebookImagesTable: string;
}

export class SocialAccountError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

export function parseSocialAccountKey(value: unknown): SocialAccountKey {
  // Requests from the existing scheduler continue to use Gôl. An explicitly
  // supplied, unrecognised destination must never silently fall back to Gôl.
  if (value === null || value === undefined) return "gol";
  if (value === "gol" || value === "dref-wen") return value;
  throw new SocialAccountError("Unknown social account.", 400);
}

export function getSocialAccountConfig(key: SocialAccountKey): SocialAccountConfig {
  if (key === "dref-wen") {
    return {
      key,
      label: "Dref Wen",
      href: "/dref-wen",
      ownerId: process.env.DREF_WEN_SCHEDULER_USER_ID,
      facebookAccessToken: process.env.DREF_WEN_FACEBOOK_ACCESS_TOKEN,
      // Read back from facebook.com/drefwen and its linked @drefwen account.
      facebookPageId: "681151585558387",
      instagramAccessToken: process.env.DREF_WEN_INSTAGRAM_ACCESS_TOKEN || process.env.DREF_WEN_FACEBOOK_ACCESS_TOKEN,
      instagramAccountId: "17841425739521098",
      instagramQueueTable: "dref_wen_instagram_scheduled_posts",
      instagramClaimFunction: "claim_due_dref_wen_instagram_scheduled_posts",
      facebookImagesTable: "dref_wen_facebook_scheduled_post_images",
    };
  }

  if (key !== "gol") throw new SocialAccountError("Unknown social account.", 400);

  return {
    key,
    label: "Gôl",
    href: "/facebook",
    facebookAccessToken: process.env.FACEBOOK_ACCESS_TOKEN,
    facebookPageId: process.env.FACEBOOK_PAGE_ID,
    instagramAccessToken: process.env.INSTAGRAM_ACCESS_TOKEN,
    instagramAccountId: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
    instagramQueueTable: "instagram_scheduled_posts",
    instagramClaimFunction: "claim_due_instagram_scheduled_posts",
    facebookImagesTable: "facebook_scheduled_post_images",
  };
}

export function canUseSocialAccount(account: SocialAccountConfig, userId: string): boolean {
  return account.key === "gol" || Boolean(account.ownerId && account.ownerId === userId);
}

export function requireSocialAccount(value: unknown, userId: string): SocialAccountConfig {
  const account = getSocialAccountConfig(parseSocialAccountKey(value));
  if (!canUseSocialAccount(account, userId)) {
    throw new SocialAccountError("You do not have access to this social account.", 403);
  }
  return account;
}

export function requestAccountValue(request: Request, bodyValue?: unknown): unknown {
  const queryValue = new URL(request.url).searchParams.get("account");
  if (bodyValue !== null && bodyValue !== undefined && queryValue !== null && bodyValue !== queryValue) {
    throw new SocialAccountError("Conflicting social accounts.", 400);
  }
  return bodyValue ?? queryValue;
}

export function getSocialAccountSummaries(userId: string): SocialAccountSummary[] {
  return SOCIAL_ACCOUNT_KEYS.map(getSocialAccountConfig)
    .filter((account) => canUseSocialAccount(account, userId))
    .map((account) => ({
      key: account.key,
      label: account.label,
      href: account.href,
      facebookConfigured: Boolean(account.facebookAccessToken && account.facebookPageId),
      instagramConfigured: Boolean(account.instagramAccessToken && account.instagramAccountId),
    }));
}

export async function getRequestSocialAccount(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new SocialAccountError("Unauthorized", 401);
  const account = requireSocialAccount(requestAccountValue(request), user.id);
  return { account, user, supabase };
}

export function socialAccountErrorResponse(error: unknown) {
  return NextResponse.json(
    { error: error instanceof Error ? error.message : "Unexpected server error." },
    { status: error instanceof SocialAccountError ? error.status : 500 }
  );
}
