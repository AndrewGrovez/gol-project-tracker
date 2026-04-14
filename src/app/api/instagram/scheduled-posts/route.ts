import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

interface InstagramScheduledPostRow {
  id: string;
  caption: string;
  scheduled_for: string;
  status: string;
  error_message: string | null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("instagram_scheduled_posts")
      .select("id, caption, scheduled_for, status, error_message")
      .eq("created_by", user.id)
      .neq("status", "published")
      .order("scheduled_for", { ascending: true })
      .limit(50);

    if (error) {
      return NextResponse.json(
        { error: error.message || "Failed to fetch Instagram scheduled posts." },
        { status: 500 }
      );
    }

    const rows = Array.isArray(data) ? (data as InstagramScheduledPostRow[]) : [];

    return NextResponse.json({
      data: rows.map((row) => ({
        id: row.id,
        caption: row.caption,
        scheduled_publish_time: Math.floor(new Date(row.scheduled_for).getTime() / 1000),
        status: row.status,
        error_message: row.error_message,
      })),
      notice:
        "Instagram posts shown here are managed by the app queue and published through the immediate Instagram publish API when due.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
