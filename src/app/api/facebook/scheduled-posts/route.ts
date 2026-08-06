import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

const ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

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

async function fetchScheduledPosts(): Promise<
  { ok: true; posts: ScheduledPost[] } | { ok: false; error: string; status: number }
> {
  const url = new URL(`https://graph.facebook.com/v22.0/${PAGE_ID}/scheduled_posts`);
  url.searchParams.set("fields", "id,message,created_time,scheduled_publish_time,status");
  url.searchParams.set("limit", "50");
  url.searchParams.set("access_token", ACCESS_TOKEN!);

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

export async function GET() {
  if (!ACCESS_TOKEN || !PAGE_ID) {
    return NextResponse.json(
      { error: "FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be configured." },
      { status: 500 }
    );
  }

  try {
    const result = await fetchScheduledPosts();

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({ data: result.posts });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!ACCESS_TOKEN || !PAGE_ID) {
      return NextResponse.json(
        { error: "FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be configured." },
        { status: 500 }
      );
    }

    const postId = new URL(request.url).searchParams.get("id")?.trim();
    if (!postId) {
      return NextResponse.json({ error: "A post id is required." }, { status: 400 });
    }

    // Only allow deleting posts that are currently scheduled on this page, so an
    // arbitrary Graph object id can never be passed through to the delete call.
    const scheduled = await fetchScheduledPosts();
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
    deleteUrl.searchParams.set("access_token", ACCESS_TOKEN);

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
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
