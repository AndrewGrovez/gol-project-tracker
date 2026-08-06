import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface InstagramScheduledPostRow {
  id: string;
  caption: string;
  scheduled_for: string;
  status: string;
  error_message: string | null;
  image_name: string | null;
  image_url: string | null;
}

// Posts scheduled before image_name existed only have the storage path, which
// looks like `instagram/<timestamp>-<sanitised name>`. Recover what we can.
function deriveImageNameFromUrl(imageUrl: string | null): string | null {
  if (!imageUrl) return null;

  try {
    const fileName = decodeURIComponent(new URL(imageUrl).pathname.split("/").pop() ?? "");
    if (!fileName) return null;
    return fileName.replace(/^\d{10,}-/, "") || null;
  } catch {
    return null;
  }
}

// Statuses that can still be called off. "processing" is excluded because the
// publish worker has already claimed the job, and "published" is done.
const CANCELLABLE_STATUSES = ["queued", "failed"];

// Same rule for edits: once the worker has claimed the job the caption it is
// publishing with is already fixed.
const EDITABLE_STATUSES = CANCELLABLE_STATUSES;

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
      .select("id, caption, scheduled_for, status, error_message, image_name, image_url")
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
        image_name: row.image_name || deriveImageNameFromUrl(row.image_url),
      })),
      notice:
        "Instagram posts shown here are managed by the app queue and published through the immediate Instagram publish API within a few minutes of the scheduled time.",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
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

    const body = (await request.json().catch(() => null)) as { caption?: unknown } | null;
    const caption = typeof body?.caption === "string" ? body.caption.trim() : "";

    if (!caption) {
      return NextResponse.json({ error: "Caption cannot be empty." }, { status: 400 });
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

    if (!EDITABLE_STATUSES.includes(existing.status)) {
      return NextResponse.json(
        { error: "That post is currently being published and can no longer be edited." },
        { status: 409 }
      );
    }

    const serviceClient = createServiceRoleClient();
    const { data: updated, error: updateError } = await serviceClient
      .from("instagram_scheduled_posts")
      .update({ caption })
      .eq("id", postId)
      .eq("created_by", user.id)
      .in("status", EDITABLE_STATUSES)
      .select("id");

    if (updateError) {
      return NextResponse.json(
        { error: updateError.message || "Failed to update the scheduled post." },
        { status: 500 }
      );
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json(
        { error: "That post is currently being published and can no longer be edited." },
        { status: 409 }
      );
    }

    return NextResponse.json({ success: true, id: postId, caption });
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
