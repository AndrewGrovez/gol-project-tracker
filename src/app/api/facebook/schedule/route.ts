import { NextResponse } from "next/server";

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
const INSTAGRAM_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const INSTAGRAM_BUSINESS_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

const FACEBOOK_MIN_LEAD_SECONDS = 10 * 60; // Facebook requires scheduled posts to be at least 10 minutes out
const INSTAGRAM_MIN_LEAD_SECONDS = 20 * 60; // Instagram Content Publishing requires ~20 minute lead

const SUPPORTED_PLATFORMS = ["facebook", "instagram"] as const;
type SupportedPlatform = (typeof SUPPORTED_PLATFORMS)[number];

interface GraphAPIError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
}

interface ScheduleResult {
  platform: SupportedPlatform;
  scheduledTime: string;
  externalId?: string;
  error?: string;
}

const ensureFacebookConfigured = () => {
  if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    throw new Error("FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be configured.");
  }
};

const ensureInstagramConfigured = () => {
  if (!INSTAGRAM_ACCESS_TOKEN || !INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    throw new Error("INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID must be configured.");
  }
};

async function scheduleFacebookPost(
  message: string,
  scheduledSeconds: number,
  imageBuffer: ArrayBuffer | null,
  imageMime: string,
  imageName: string
) {
  ensureFacebookConfigured();

  let response: Response;
  if (imageBuffer) {
    const multipart = new FormData();
    multipart.append("caption", message);
    multipart.append("published", "false");
    multipart.append("scheduled_publish_time", scheduledSeconds.toString());
    multipart.append("access_token", FACEBOOK_ACCESS_TOKEN!);

    const blob = new Blob([imageBuffer], { type: imageMime });
    multipart.append("source", blob, imageName);

    response = await fetch(`https://graph.facebook.com/v22.0/${FACEBOOK_PAGE_ID}/photos`, {
      method: "POST",
      body: multipart,
    });
  } else {
    const params = new URLSearchParams();
    params.append("message", message);
    params.append("published", "false");
    params.append("scheduled_publish_time", scheduledSeconds.toString());
    params.append("access_token", FACEBOOK_ACCESS_TOKEN!);

    response = await fetch(`https://graph.facebook.com/v22.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: "POST",
      body: params,
    });
  }

  const responseData = await response.json();
  if (!response.ok) {
    const error = (responseData?.error as GraphAPIError | undefined)?.message ||
      "Facebook API responded with an error.";
    throw new Error(error);
  }

  return responseData?.id as string | undefined;
}

async function scheduleInstagramPost(
  message: string,
  scheduledSeconds: number,
  imageBuffer: ArrayBuffer,
  imageMime: string,
  imageName: string
) {
  ensureInstagramConfigured();

  const multipart = new FormData();
  multipart.append("caption", message);
  multipart.append("is_scheduled", "true");
  multipart.append("scheduled_publish_time", scheduledSeconds.toString());
  multipart.append("access_token", INSTAGRAM_ACCESS_TOKEN!);

  const blob = new Blob([imageBuffer], { type: imageMime });
  multipart.append("source", blob, imageName);

  const response = await fetch(
    `https://graph.facebook.com/v22.0/${INSTAGRAM_BUSINESS_ACCOUNT_ID}/media`,
    {
      method: "POST",
      body: multipart,
    }
  );

  const responseData = await response.json();
  if (!response.ok) {
    const error = (responseData?.error as GraphAPIError | undefined)?.message ||
      "Instagram API responded with an error.";
    throw new Error(error);
  }

  return responseData?.id as string | undefined;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = (formData.get("message")?.toString() || "").trim();
    const scheduledTimesRaw = formData.get("scheduledTimes");
    const imageFile = formData.get("image");
    const platformsRaw = formData.get("platforms");

    if (!message) {
      return NextResponse.json(
        { error: "Message is required." },
        { status: 400 }
      );
    }

    if (!scheduledTimesRaw) {
      return NextResponse.json(
        { error: "At least one scheduled time is required." },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "At least one scheduled time is required." },
        { status: 400 }
      );
    }

    let selectedPlatforms: SupportedPlatform[] = ["facebook"];
    if (platformsRaw) {
      try {
        const parsed = JSON.parse(platformsRaw.toString());
        if (Array.isArray(parsed) && parsed.length > 0) {
          selectedPlatforms = parsed
            .map((entry) => (typeof entry === "string" ? entry.toLowerCase() : ""))
            .filter((entry): entry is SupportedPlatform =>
              SUPPORTED_PLATFORMS.includes(entry as SupportedPlatform)
            );
        }
      } catch {
        return NextResponse.json(
          { error: "platforms must be a JSON array of strings." },
          { status: 400 }
        );
      }
    }

    if (selectedPlatforms.length === 0) {
      return NextResponse.json(
        { error: "Select at least one platform to schedule." },
        { status: 400 }
      );
    }

    const nowInSeconds = Math.floor(Date.now() / 1000);

    const image = imageFile instanceof File ? imageFile : null;
    const imageBuffer = image ? await image.arrayBuffer() : null;
    const imageMime = image?.type || "image/jpeg";
    const imageName = image?.name || "scheduled-image.jpg";

    const requiresImage = selectedPlatforms.includes("instagram");
    if (requiresImage && !imageBuffer) {
      return NextResponse.json(
        { error: "Instagram scheduling requires an image upload." },
        { status: 400 }
      );
    }

    const results: ScheduleResult[] = [];

    for (const isoTime of scheduledTimes) {
      const scheduledDate = new Date(isoTime);
      if (Number.isNaN(scheduledDate.getTime())) {
        for (const platform of selectedPlatforms) {
          results.push({
            platform,
            scheduledTime: isoTime,
            error: "Invalid date provided.",
          });
        }
        continue;
      }

      const scheduledSeconds = Math.floor(scheduledDate.getTime() / 1000);

      for (const platform of selectedPlatforms) {
        const minLead =
          platform === "facebook"
            ? FACEBOOK_MIN_LEAD_SECONDS
            : INSTAGRAM_MIN_LEAD_SECONDS;

        if (scheduledSeconds - nowInSeconds < minLead) {
          results.push({
            platform,
            scheduledTime: isoTime,
            error:
              platform === "facebook"
                ? "Facebook scheduling requires dates at least 10 minutes in the future."
                : "Instagram scheduling requires dates at least 20 minutes in the future.",
          });
          continue;
        }

        try {
          if (platform === "facebook") {
            const externalId = await scheduleFacebookPost(
              message,
              scheduledSeconds,
              imageBuffer,
              imageMime,
              imageName
            );
            results.push({
              platform,
              scheduledTime: isoTime,
              externalId,
            });
          } else {
            if (!imageBuffer) {
              results.push({
                platform,
                scheduledTime: isoTime,
                error: "Instagram scheduling requires an image upload.",
              });
              continue;
            }

            const externalId = await scheduleInstagramPost(
              message,
              scheduledSeconds,
              imageBuffer,
              imageMime,
              imageName
            );
            results.push({
              platform,
              scheduledTime: isoTime,
              externalId,
            });
          }
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Unexpected error while contacting the social platform.";
          results.push({ platform, scheduledTime: isoTime, error: message });
        }
      }
    }

    const hasErrors = results.some((result) => result.error);

    return NextResponse.json(
      {
        success: !hasErrors,
        results,
      },
      { status: hasErrors ? 207 : 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected server error.";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
