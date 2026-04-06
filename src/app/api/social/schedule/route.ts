import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const FB_MIN_LEAD_SECONDS = 10 * 60; // 10 minutes
const FB_MAX_LEAD_SECONDS = 75 * 24 * 60 * 60; // 75 days
const IG_MIN_LEAD_SECONDS = 20 * 60; // 20 minutes
const IG_MAX_LEAD_SECONDS = 75 * 24 * 60 * 60; // 75 days

const STORAGE_BUCKET = "social-scheduler";

interface ScheduleResult {
  scheduledTime: string;
  externalId?: string;
  error?: string;
}

interface PlatformResults {
  facebook?: ScheduleResult[];
  instagram?: ScheduleResult[];
}

// ─── Supabase image upload ────────────────────────────────────────────────────

async function uploadImageToSupabase(
  buffer: ArrayBuffer,
  mime: string,
  name: string
): Promise<string> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Ensure bucket exists (no-op if already present)
  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => null);

  const path = `instagram/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// ─── Facebook ─────────────────────────────────────────────────────────────────

async function scheduleFacebookPost(
  message: string,
  scheduledSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string
): Promise<string | undefined> {
  let response: Response;

  if (imageBuffer) {
    const multipart = new FormData();
    multipart.append("caption", message);
    multipart.append("published", "false");
    multipart.append("scheduled_publish_time", scheduledSeconds.toString());
    multipart.append("unpublished_content_type", "SCHEDULED");
    multipart.append("access_token", FB_ACCESS_TOKEN!);
    multipart.append("source", new Blob([imageBuffer], { type: imageMime }), imageName);

    response = await fetch(`https://graph.facebook.com/v22.0/${FB_PAGE_ID}/photos`, {
      method: "POST",
      body: multipart,
    });
  } else {
    const params = new URLSearchParams({
      message,
      published: "false",
      scheduled_publish_time: scheduledSeconds.toString(),
      unpublished_content_type: "SCHEDULED",
      access_token: FB_ACCESS_TOKEN!,
    });

    response = await fetch(`https://graph.facebook.com/v22.0/${FB_PAGE_ID}/feed`, {
      method: "POST",
      body: params,
    });
  }

  const data = await response.json();
  if (!response.ok) {
    const err = data?.error;
    let msg = err?.message || "Facebook API error.";
    if (err?.error_subcode === 1363168) msg = "Facebook scheduling only allows dates within 75 days.";
    if (err?.error_subcode === 1363169) msg = "Facebook scheduling requires dates at least 10 minutes ahead.";
    throw new Error(msg);
  }

  return data?.id as string | undefined;
}

async function processFacebook(
  message: string,
  scheduledTimes: string[],
  nowSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string
): Promise<ScheduleResult[]> {
  if (!FB_ACCESS_TOKEN || !FB_PAGE_ID) {
    return scheduledTimes.map((t) => ({
      scheduledTime: t,
      error: "FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID are not configured.",
    }));
  }

  const results: ScheduleResult[] = [];

  for (const isoTime of scheduledTimes) {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) {
      results.push({ scheduledTime: isoTime, error: "Invalid date." });
      continue;
    }

    const scheduledSeconds = Math.floor(date.getTime() / 1000);
    const lead = scheduledSeconds - nowSeconds;

    if (lead < FB_MIN_LEAD_SECONDS) {
      results.push({ scheduledTime: isoTime, error: "Must be at least 10 minutes in the future." });
      continue;
    }
    if (lead > FB_MAX_LEAD_SECONDS) {
      results.push({ scheduledTime: isoTime, error: "Must be within 75 days." });
      continue;
    }

    try {
      const externalId = await scheduleFacebookPost(
        message,
        scheduledSeconds,
        imageBuffer,
        imageMime,
        imageName
      );
      results.push({ scheduledTime: isoTime, externalId });
    } catch (err) {
      results.push({
        scheduledTime: isoTime,
        error: err instanceof Error ? err.message : "Unexpected error.",
      });
    }
  }

  return results;
}

// ─── Instagram ────────────────────────────────────────────────────────────────

async function scheduleInstagramPost(
  caption: string,
  scheduledSeconds: number,
  imageUrl: string
): Promise<string | undefined> {
  // Step 1: create media container
  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    scheduled_publish_time: scheduledSeconds.toString(),
    published: "false",
    access_token: IG_ACCESS_TOKEN!,
  });

  const containerRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
    { method: "POST", body: containerParams }
  );
  const containerData = await containerRes.json();

  if (!containerRes.ok) {
    const msg = containerData?.error?.message || "Failed to create Instagram media container.";
    throw new Error(msg);
  }

  const creationId = containerData.id as string;

  // Step 2: publish (Instagram holds until scheduled_publish_time)
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: IG_ACCESS_TOKEN!,
  });

  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`,
    { method: "POST", body: publishParams }
  );
  const publishData = await publishRes.json();

  if (!publishRes.ok) {
    const msg = publishData?.error?.message || "Failed to schedule Instagram post.";
    throw new Error(msg);
  }

  return publishData.id as string | undefined;
}

async function processInstagram(
  caption: string,
  scheduledTimes: string[],
  nowSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string
): Promise<ScheduleResult[]> {
  if (!IG_ACCESS_TOKEN || !IG_ACCOUNT_ID) {
    return scheduledTimes.map((t) => ({
      scheduledTime: t,
      error: "INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID are not configured.",
    }));
  }

  if (!imageBuffer) {
    return scheduledTimes.map((t) => ({
      scheduledTime: t,
      error: "Instagram requires an image.",
    }));
  }

  // Upload once, reuse URL for all scheduled times
  let imageUrl: string;
  try {
    imageUrl = await uploadImageToSupabase(imageBuffer, imageMime, imageName);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Image upload failed.";
    return scheduledTimes.map((t) => ({ scheduledTime: t, error: msg }));
  }

  const results: ScheduleResult[] = [];

  for (const isoTime of scheduledTimes) {
    const date = new Date(isoTime);
    if (isNaN(date.getTime())) {
      results.push({ scheduledTime: isoTime, error: "Invalid date." });
      continue;
    }

    const scheduledSeconds = Math.floor(date.getTime() / 1000);
    const lead = scheduledSeconds - nowSeconds;

    if (lead < IG_MIN_LEAD_SECONDS) {
      results.push({ scheduledTime: isoTime, error: "Instagram requires at least 20 minutes lead time." });
      continue;
    }
    if (lead > IG_MAX_LEAD_SECONDS) {
      results.push({ scheduledTime: isoTime, error: "Must be within 75 days." });
      continue;
    }

    try {
      const externalId = await scheduleInstagramPost(caption, scheduledSeconds, imageUrl);
      results.push({ scheduledTime: isoTime, externalId });
    } catch (err) {
      results.push({
        scheduledTime: isoTime,
        error: err instanceof Error ? err.message : "Unexpected error.",
      });
    }
  }

  return results;
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = (formData.get("message")?.toString() ?? "").trim();
    const scheduledTimesRaw = formData.get("scheduledTimes");
    const platformsRaw = formData.get("platforms");
    const imageFile = formData.get("image");

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!scheduledTimesRaw) {
      return NextResponse.json({ error: "At least one scheduled time is required." }, { status: 400 });
    }

    let scheduledTimes: string[] = [];
    try {
      scheduledTimes = JSON.parse(scheduledTimesRaw.toString());
    } catch {
      return NextResponse.json({ error: "scheduledTimes must be a JSON array of ISO strings." }, { status: 400 });
    }

    if (!Array.isArray(scheduledTimes) || scheduledTimes.length === 0) {
      return NextResponse.json({ error: "At least one scheduled time is required." }, { status: 400 });
    }

    let platforms: string[] = ["facebook"];
    if (platformsRaw) {
      try {
        platforms = JSON.parse(platformsRaw.toString());
      } catch {
        // ignore, default to facebook
      }
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const image = imageFile instanceof File ? imageFile : null;
    const imageBuffer = image ? await image.arrayBuffer() : null;
    const imageMime = image?.type || "image/jpeg";
    const imageName = image?.name || "image.jpg";

    const platformResults: PlatformResults = {};

    const tasks: Promise<void>[] = [];

    if (platforms.includes("facebook")) {
      tasks.push(
        processFacebook(message, scheduledTimes, nowSeconds, imageBuffer, imageMime, imageName).then(
          (r) => { platformResults.facebook = r; }
        )
      );
    }

    if (platforms.includes("instagram")) {
      tasks.push(
        processInstagram(message, scheduledTimes, nowSeconds, imageBuffer, imageMime, imageName).then(
          (r) => { platformResults.instagram = r; }
        )
      );
    }

    await Promise.all(tasks);

    const hasErrors = Object.values(platformResults).some((results) =>
      results?.some((r) => r.error)
    );

    return NextResponse.json(
      { success: !hasErrors, results: platformResults },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
