import { NextResponse } from "next/server";

const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

interface ScheduledPost {
  id: string;
  caption?: string;
  timestamp?: string;
  scheduled_publish_time?: number;
  status?: string;
}

export async function GET() {
  if (!ACCESS_TOKEN || !IG_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID must be configured." },
      { status: 500 }
    );
  }

  try {
    const url = new URL(`https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/scheduled_posts`);
    url.searchParams.set("fields", "id,caption,timestamp,scheduled_publish_time,status");
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", ACCESS_TOKEN);

    const response = await fetch(url, { cache: "no-store" });
    const data = await response.json() as {
      data?: ScheduledPost[];
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Failed to fetch Instagram scheduled posts." },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: data.data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
