import { NextResponse } from "next/server";
import { getRequestSocialAccount, socialAccountErrorResponse, type SocialAccountConfig } from "@/lib/social/accounts";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ScheduledPost {
  id: string;
  message?: string;
  created_time: string;
  scheduled_publish_time?: number;
  status?: string;
}

interface ScheduledPostsResponse {
  data: ScheduledPost[];
  paging?: {
    cursors?: {
      before?: string;
      after?: string;
    };
    next?: string;
    previous?: string;
  };
}

async function fetchScheduledPosts(account: SocialAccountConfig): Promise<
  { ok: true; posts: ScheduledPost[] } | { ok: false; error: string; status: number }
> {
  const url = new URL(`https://graph.facebook.com/v22.0/${account.facebookPageId}/scheduled_posts`);
  url.searchParams.set("fields", "id,message,created_time,scheduled_publish_time,status");
  url.searchParams.set("limit", "50");
  url.searchParams.set("access_token", account.facebookAccessToken!);

  const response = await fetch(url, { cache: "no-store" });
  const data = (await response.json()) as ScheduledPostsResponse & {
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      ok: false,
      error: data?.error?.message || "Failed to fetch scheduled posts.",
      status: response.status,
    };
  }

  return { ok: true, posts: data.data || [] };
}

// Meta does not return the uploaded file name, so look it up in our sidecar
// table. Best effort — the list still renders without it.
async function loadImageNames(postIds: string[], account: SocialAccountConfig, supabase: SupabaseClient): Promise<Record<string, string>> {
  if (postIds.length === 0) return {};

  try {
    const { data, error } = await supabase
      .from(account.facebookImagesTable)
      .select("post_id, image_name")
      .in("post_id", postIds);

    if (error || !Array.isArray(data)) return {};

    return Object.fromEntries(
      (data as Array<{ post_id: string; image_name: string }>).map((row) => [
        row.post_id,
        row.image_name,
      ])
    );
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  try {
    const { account, supabase } = await getRequestSocialAccount(request);
    if (!account.facebookAccessToken || !account.facebookPageId) {
      return NextResponse.json({ error: `${account.label}'s Facebook Page has not been connected.` }, { status: 503 });
    }
    const result = await fetchScheduledPosts(account);
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: result.status });
    const imageNames = await loadImageNames(result.posts.map((post) => post.id), account, supabase);
    return NextResponse.json({ data: result.posts.map((post) => ({ ...post, image_name: imageNames[post.id] ?? null })) });
  } catch (error) {
    return socialAccountErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const { account } = await getRequestSocialAccount(request);

    if (!account.facebookAccessToken || !account.facebookPageId) {
      return NextResponse.json(
        { error: `${account.label}'s Facebook Page has not been connected.` },
        { status: 500 }
      );
    }

    const postId = new URL(request.url).searchParams.get("id")?.trim();
    if (!postId) {
      return NextResponse.json({ error: "A post id is required." }, { status: 400 });
    }

    const body = (await request.json().catch(() => null)) as { message?: unknown } | null;
    const newMessage = typeof body?.message === "string" ? body.message.trim() : "";

    if (!newMessage) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }

    // Same guard as DELETE: only touch posts still scheduled on this Page.
    const scheduled = await fetchScheduledPosts(account);
    if (!scheduled.ok) {
      return NextResponse.json({ error: scheduled.error }, { status: scheduled.status });
    }

    if (!scheduled.posts.some((post) => post.id === postId)) {
      return NextResponse.json(
        { error: "That post is no longer scheduled on this Page. Refresh and try again." },
        { status: 404 }
      );
    }

    const params = new URLSearchParams({
      message: newMessage,
      access_token: account.facebookAccessToken,
    });

    const response = await fetch(
      `https://graph.facebook.com/v22.0/${encodeURIComponent(postId)}`,
      { method: "POST", body: params, cache: "no-store" }
    );

    const data = (await response.json()) as {
      success?: boolean;
      error?: { message?: string; error_user_msg?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.error_user_msg ||
            data?.error?.message ||
            "Failed to update the scheduled post.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, id: postId, message: newMessage });
  } catch (error) {
    return socialAccountErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { account } = await getRequestSocialAccount(request);

    if (!account.facebookAccessToken || !account.facebookPageId) {
      return NextResponse.json(
        { error: `${account.label}'s Facebook Page has not been connected.` },
        { status: 500 }
      );
    }

    const postId = new URL(request.url).searchParams.get("id")?.trim();
    if (!postId) {
      return NextResponse.json({ error: "A post id is required." }, { status: 400 });
    }

    // Only allow deleting posts that are currently scheduled on this page, so an
    // arbitrary Graph object id can never be passed through to the delete call.
    const scheduled = await fetchScheduledPosts(account);
    if (!scheduled.ok) {
      return NextResponse.json({ error: scheduled.error }, { status: scheduled.status });
    }

    if (!scheduled.posts.some((post) => post.id === postId)) {
      return NextResponse.json(
        { error: "That post is no longer scheduled on this Page. Refresh and try again." },
        { status: 404 }
      );
    }

    const deleteUrl = new URL(`https://graph.facebook.com/v22.0/${encodeURIComponent(postId)}`);
    deleteUrl.searchParams.set("access_token", account.facebookAccessToken);

    const response = await fetch(deleteUrl, { method: "DELETE", cache: "no-store" });
    const data = (await response.json()) as {
      success?: boolean;
      error?: { message?: string; error_user_msg?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.error_user_msg ||
            data?.error?.message ||
            "Failed to cancel the scheduled post.",
        },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, id: postId });
  } catch (error) {
    return socialAccountErrorResponse(error);
  }
}
