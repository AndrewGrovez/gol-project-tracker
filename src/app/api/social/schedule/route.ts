import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import { getInstagramPublishingConfigError } from "@/lib/social/instagram-publishing";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

const FB_MIN_LEAD_SECONDS = 10 * 60;
const FB_MAX_LEAD_SECONDS = 75 * 24 * 60 * 60;
const IG_MIN_LEAD_SECONDS = 5 * 60;

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

interface InstagramQueuedInsert {
  created_by: string;
  caption: string;
  image_url: string;
  scheduled_for: string;
}

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

async function uploadImageToSupabase(
  buffer: ArrayBuffer,
  mime: string,
  name: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => null);

  const path = `instagram/${Date.now()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, { contentType: mime, upsert: false });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

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
    if (err?.error_subcode === 1363168) {
      msg = "Facebook scheduling only allows dates within 75 days.";
    }
    if (err?.error_subcode === 1363169) {
      msg = "Facebook scheduling requires dates at least 10 minutes ahead.";
    }
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
    return scheduledTimes.map((scheduledTime) => ({
      scheduledTime,
      error: "FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID are not configured.",
    }));
  }

  const results: ScheduleResult[] = [];

  for (const isoTime of scheduledTimes) {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) {
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
    } catch (error) {
      results.push({
        scheduledTime: isoTime,
        error: error instanceof Error ? error.message : "Unexpected error.",
      });
    }
  }

  return results;
}

async function queueInstagramPosts(
  caption: string,
  scheduledTimes: string[],
  nowSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string,
  createdByUserId: string
): Promise<ScheduleResult[]> {
  const configError = getInstagramPublishingConfigError();
  if (configError) {
    return scheduledTimes.map((scheduledTime) => ({
      scheduledTime,
      error: configError,
    }));
  }

  if (!imageBuffer) {
    return scheduledTimes.map((scheduledTime) => ({
      scheduledTime,
      error: "Instagram requires an image.",
    }));
  }

  let imageUrl: string;
  try {
    imageUrl = await uploadImageToSupabase(imageBuffer, imageMime, imageName);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Image upload failed.";
    return scheduledTimes.map((scheduledTime) => ({
      scheduledTime,
      error: message,
    }));
  }

  const results: ScheduleResult[] = [];
  const jobsToQueue: Array<{ scheduledTime: string; row: InstagramQueuedInsert }> = [];

  for (const isoTime of scheduledTimes) {
    const date = new Date(isoTime);
    if (Number.isNaN(date.getTime())) {
      results.push({ scheduledTime: isoTime, error: "Invalid date." });
      continue;
    }

    const scheduledSeconds = Math.floor(date.getTime() / 1000);
    const lead = scheduledSeconds - nowSeconds;

    if (lead < IG_MIN_LEAD_SECONDS) {
      results.push({
        scheduledTime: isoTime,
        error: "Instagram queueing requires dates at least 5 minutes in the future.",
      });
      continue;
    }

    jobsToQueue.push({
      scheduledTime: isoTime,
      row: {
        created_by: createdByUserId,
        caption,
        image_url: imageUrl,
        scheduled_for: date.toISOString(),
      },
    });
  }

  if (jobsToQueue.length === 0) {
    return results;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("instagram_scheduled_posts")
    .insert(jobsToQueue.map((job) => job.row))
    .select("id");

  if (error) {
    return [
      ...results,
      ...jobsToQueue.map((job) => ({
        scheduledTime: job.scheduledTime,
        error: `Failed to queue Instagram post: ${error.message}`,
      })),
    ];
  }

  const insertedRows = Array.isArray(data) ? data : [];

  return [
    ...results,
    ...jobsToQueue.map((job, index) => ({
      scheduledTime: job.scheduledTime,
      externalId:
        typeof insertedRows[index]?.id === "string" ? insertedRows[index].id : undefined,
    })),
  ];
}

export async function POST(request: Request) {
  try {
    const supabase = await createUserClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
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
      return NextResponse.json(
        { error: "scheduledTimes must be a JSON array of ISO strings." },
        { status: 400 }
      );
    }

    if (!Array.isArray(scheduledTimes) || scheduledTimes.length === 0) {
      return NextResponse.json({ error: "At least one scheduled time is required." }, { status: 400 });
    }

    let platforms: string[] = ["facebook"];
    if (platformsRaw) {
      try {
        platforms = JSON.parse(platformsRaw.toString());
      } catch {
        platforms = ["facebook"];
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
          (results) => {
            platformResults.facebook = results;
          }
        )
      );
    }

    if (platforms.includes("instagram")) {
      tasks.push(
        queueInstagramPosts(
          message,
          scheduledTimes,
          nowSeconds,
          imageBuffer,
          imageMime,
          imageName,
          user.id
        ).then((results) => {
          platformResults.instagram = results;
        })
      );
    }

    await Promise.all(tasks);

    const resultsByPlatform = [platformResults.facebook, platformResults.instagram].filter(
      (results): results is ScheduleResult[] => Boolean(results)
    );

    const hasErrors = resultsByPlatform.some((results) =>
      results.some((result) => Boolean(result.error))
    );

    return NextResponse.json(
      { success: !hasErrors, results: platformResults },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
