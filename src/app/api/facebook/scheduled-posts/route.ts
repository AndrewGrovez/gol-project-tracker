import { NextResponse } from "next/server";

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

export async function GET() {
  if (!ACCESS_TOKEN || !PAGE_ID) {
    return NextResponse.json(
      { error: "FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be configured." },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`https://graph.facebook.com/v22.0/${PAGE_ID}/scheduled_posts`);
    url.searchParams.set("fields", "id,message,created_time,scheduled_publish_time,status");
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", ACCESS_TOKEN);

    const response = await fetch(url, { cache: "no-store" });
    const data = (await response.json()) as ScheduledPostsResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Failed to fetch scheduled posts." },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: data.data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
