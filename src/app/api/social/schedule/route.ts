import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import { getInstagramPublishingConfigError } from "@/lib/social/instagram-publishing";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { requireSocialAccount, requestAccountValue, socialAccountErrorResponse, type SocialAccountConfig } from "@/lib/social/accounts";

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
  image_name: string | null;
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
  account: SocialAccountConfig,
  buffer: ArrayBuffer,
  mime: string,
  name: string
): Promise<string> {
  const supabase = createServiceRoleClient();

  await supabase.storage.createBucket(STORAGE_BUCKET, { public: true }).catch(() => null);

  const path = `${account.key}/instagram/${crypto.randomUUID()}-${name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
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
  account: SocialAccountConfig,
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
    multipart.append("access_token", account.facebookAccessToken!);
    multipart.append("source", new Blob([imageBuffer], { type: imageMime }), imageName);

    response = await fetch(`https://graph.facebook.com/v22.0/${account.facebookPageId}/photos`, {
      method: "POST",
      body: multipart,
    });
  } else {
    const params = new URLSearchParams({
      message,
      published: "false",
      scheduled_publish_time: scheduledSeconds.toString(),
      unpublished_content_type: "SCHEDULED",
      access_token: account.facebookAccessToken!,
    });

    response = await fetch(`https://graph.facebook.com/v22.0/${account.facebookPageId}/feed`, {
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
  account: SocialAccountConfig,
  message: string,
  scheduledTimes: string[],
  nowSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string
): Promise<ScheduleResult[]> {
  if (!account.facebookAccessToken || !account.facebookPageId) {
    return scheduledTimes.map((scheduledTime) => ({
      scheduledTime,
      error: `${account.label}'s Facebook Page has not been connected.`,
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
        account,
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

// The /photos endpoint returns a bare photo id, but the scheduled-posts listing
// keys off "{page id}_{photo id}". Store the latter so the two actually match —
// /feed already hands back the prefixed form, hence the guard.
const toPagePostId = (externalId: string, account: SocialAccountConfig) =>
  externalId.includes("_") ? externalId : `${account.facebookPageId}_${externalId}`;

// Meta does not retain the uploaded file name, so keep our own record of it
// against the returned Graph post id.
async function recordFacebookImageNames(
  account: SocialAccountConfig,
  results: ScheduleResult[],
  originalImageName: string | null,
  createdByUserId: string
) {
  if (!originalImageName) return;

  const rows = results
    .filter((result) => !result.error && result.externalId)
    .map((result) => ({
      post_id: toPagePostId(result.externalId!, account),
      image_name: originalImageName,
      created_by: createdByUserId,
    }));

  if (rows.length === 0) return;

  const supabase = createServiceRoleClient();
  // Best effort: a missing file name must never fail an otherwise good schedule.
  await supabase
    .from(account.facebookImagesTable)
    .upsert(rows, { onConflict: "post_id" })
    .then(undefined, () => null);
}

async function queueInstagramPosts(
  account: SocialAccountConfig,
  caption: string,
  scheduledTimes: string[],
  nowSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string,
  originalImageName: string | null,
  createdByUserId: string
): Promise<ScheduleResult[]> {
  const configError = getInstagramPublishingConfigError(account.key);
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
    imageUrl = await uploadImageToSupabase(account, imageBuffer, imageMime, imageName);
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
        image_name: originalImageName,
        scheduled_for: date.toISOString(),
      },
    });
  }

  if (jobsToQueue.length === 0) {
    return results;
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from(account.instagramQueueTable)
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
    const account = requireSocialAccount(requestAccountValue(request, formData.get("account")), user.id);
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

    if (!Array.isArray(scheduledTimes) || scheduledTimes.length === 0 || !scheduledTimes.every((time) => typeof time === "string")) {
      return NextResponse.json({ error: "At least one scheduled time is required." }, { status: 400 });
    }

    let platforms: string[] = ["facebook"];
    if (platformsRaw) {
      try {
        platforms = JSON.parse(platformsRaw.toString());
      } catch {
        return NextResponse.json({ error: "Invalid platforms." }, { status: 400 });
      }
    }

    if (!Array.isArray(platforms) || platforms.length === 0 || !platforms.every((platform) => platform === "facebook" || platform === "instagram")) {
      return NextResponse.json({ error: "Choose Facebook, Instagram, or both." }, { status: 400 });
    }

    const nowSeconds = Math.floor(Date.now() / 1000);
    const image = imageFile instanceof File ? imageFile : null;
    const imageBuffer = image ? await image.arrayBuffer() : null;
    const imageMime = image?.type || "image/jpeg";
    const imageName = image?.name || "image.jpg";
    const originalImageName = image?.name?.trim() || null;

    const platformResults: PlatformResults = {};
    const tasks: Promise<void>[] = [];

    if (platforms.includes("facebook")) {
      tasks.push(
        processFacebook(account, message, scheduledTimes, nowSeconds, imageBuffer, imageMime, imageName).then(
          async (results) => {
            platformResults.facebook = results;
            await recordFacebookImageNames(account, results, originalImageName, user.id);
          }
        )
      );
    }

    if (platforms.includes("instagram")) {
      tasks.push(
        queueInstagramPosts(
          account,
          message,
          scheduledTimes,
          nowSeconds,
          imageBuffer,
          imageMime,
          imageName,
          originalImageName,
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
    return socialAccountErrorResponse(error);
  }
}
