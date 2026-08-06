import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface InstagramScheduledPostRow {
  id: string;
  caption: string;
  scheduled_for: string;
  status: string;
  error_message: string | null;
}

// Statuses that can still be called off. "processing" is excluded because the
// publish worker has already claimed the job, and "published" is done.
const CANCELLABLE_STATUSES = ["queued", "failed"];

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
      .not("status", "in", '("published","cancelled")')
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
        "Instagram posts shown here are managed by the app queue and published through the immediate Instagram publish API within a few minutes of the scheduled time.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
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

    const postId = new URL(request.url).searchParams.get("id")?.trim();
    if (!postId) {
      return NextResponse.json({ error: "A post id is required." }, { status: 400 });
    }

    const { data: existing, error: lookupError } = await supabase
      .from("instagram_scheduled_posts")
      .select("id, status")
      .eq("id", postId)
      .eq("created_by", user.id)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json(
        { error: lookupError.message || "Failed to load the scheduled post." },
        { status: 500 }
      );
    }

    if (!existing) {
      return NextResponse.json({ error: "Scheduled post not found." }, { status: 404 });
    }

    if (existing.status === "published") {
      return NextResponse.json(
        { error: "That post has already been published to Instagram." },
        { status: 409 }
      );
    }

    if (!CANCELLABLE_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: "That post is currently being published and can no longer be cancelled." },
        { status: 409 }
      );
    }

    // Writes go through the service role client — authenticated users only hold
    // a select grant on this table.
    const serviceClient = createServiceRoleClient();
    const { data: cancelled, error: cancelError } = await serviceClient
      .from("instagram_scheduled_posts")
      .update({ status: "cancelled", error_message: null })
      .eq("id", postId)
      .eq("created_by", user.id)
      .in("status", CANCELLABLE_STATUSES)
      .select("id");

    if (cancelError) {
      return NextResponse.json(
        { error: cancelError.message || "Failed to cancel the scheduled post." },
        { status: 500 }
      );
    }

    if (!cancelled || cancelled.length === 0) {
      return NextResponse.json(
        { error: "That post is currently being published and can no longer be cancelled." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, id: postId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
