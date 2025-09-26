import { NextResponse } from "next/server";

const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

interface ScheduledInstagramPost {
  id: string;
  caption?: string;
  media_type?: string;
  media_url?: string;
  permalink?: string;
  scheduled_publish_time?: number;
  status?: string;
}

interface ScheduledResponse {
  data: ScheduledInstagramPost[];
}

export async function GET() {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    return NextResponse.json(
      { error: "INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID must be configured." },
      { status: 500 }
    );
  }

  try {
    const url = new URL(
      `https://graph.facebook.com/v22.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/scheduled_media`
    );
    url.searchParams.set(
      "fields",
      "id,caption,media_type,media_url,permalink,scheduled_publish_time,status"
    );
    url.searchParams.set("limit", "50");
    url.searchParams.set("access_token", INSTAGRAM_ACCESS_TOKEN);

    const response = await fetch(url, { cache: "no-store" });
    const payload = (await response.json()) as ScheduledResponse & {
      error?: { message?: string };
    };

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message || "Failed to fetch Instagram scheduled posts." },
        { status: response.status }
      );
    }

    return NextResponse.json({ data: payload.data || [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
