import { NextResponse } from "next/server";

const FACEBOOK_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;
const FACEBOOK_PAGE_ID = process.env.FACEBOOK_PAGE_ID;

const FACEBOOK_MIN_LEAD_SECONDS = 10 * 60; // Facebook requires scheduled posts to be at least 10 minutes out
const FACEBOOK_MAX_LEAD_SECONDS = 75 * 24 * 60 * 60; // Facebook caps scheduled posts ~75 days ahead

interface GraphAPIError {
  message: string;
  type?: string;
  code?: number;
  error_subcode?: number;
  error_user_title?: string;
  error_user_msg?: string;
  fbtrace_id?: string;
}

interface ScheduleResult {
  scheduledTime: string;
  externalId?: string;
  error?: string;
}

class FacebookScheduleError extends Error {
  details?: GraphAPIError;

  constructor(message: string, details?: GraphAPIError) {
    super(message);
    this.name = "FacebookScheduleError";
    this.details = details;
  }
}

const ensureFacebookConfigured = () => {
  if (!FACEBOOK_ACCESS_TOKEN || !FACEBOOK_PAGE_ID) {
    throw new Error("FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID must be configured.");
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
    multipart.append("unpublished_content_type", "SCHEDULED");
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
    params.append("unpublished_content_type", "SCHEDULED");
    params.append("access_token", FACEBOOK_ACCESS_TOKEN!);

    response = await fetch(`https://graph.facebook.com/v22.0/${FACEBOOK_PAGE_ID}/feed`, {
      method: "POST",
      body: params,
    });
  }

  const responseData = await response.json();
  if (!response.ok) {
    const graphError = responseData?.error as GraphAPIError | undefined;
    let friendly =
      graphError?.message || "Facebook API responded with an error.";

    if (graphError?.error_subcode === 1363168) {
      friendly = "Facebook scheduling only allows dates within the next 75 days.";
    } else if (graphError?.error_subcode === 1363169) {
      friendly = "Facebook scheduling requires dates at least 10 minutes in the future.";
    } else if (friendly === "An unknown error has occurred.") {
      friendly =
        "Facebook returned an unspecified error. Try a closer publish time (within 75 days) or verify the Page has publishing permissions.";
    }

    const debugHints: string[] = [];
    if (graphError?.type) {
      debugHints.push(`type ${graphError.type}`);
    }
    if (typeof graphError?.code === "number") {
      debugHints.push(`code ${graphError.code}`);
    }
    if (typeof graphError?.error_subcode === "number") {
      debugHints.push(`subcode ${graphError.error_subcode}`);
    }
    if (graphError?.error_user_title || graphError?.error_user_msg) {
      debugHints.push(
        [graphError.error_user_title, graphError.error_user_msg]
          .filter(Boolean)
          .join(": ")
      );
    }

    if (debugHints.length > 0) {
      friendly += ` [${debugHints.join(" · ")}]`;
    }

    throw new FacebookScheduleError(friendly, graphError);
  }

  return responseData?.id as string | undefined;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const message = (formData.get("message")?.toString() || "").trim();
    const scheduledTimesRaw = formData.get("scheduledTimes");
    const imageFile = formData.get("image");

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
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

    const nowInSeconds = Math.floor(Date.now() / 1000);

    const image = imageFile instanceof File ? imageFile : null;
    const imageBuffer = image ? await image.arrayBuffer() : null;
    const imageMime = image?.type || "image/jpeg";
    const imageName = image?.name || "scheduled-image.jpg";

    const results: ScheduleResult[] = [];

    for (const isoTime of scheduledTimes) {
      const scheduledDate = new Date(isoTime);
      if (Number.isNaN(scheduledDate.getTime())) {
        results.push({
          scheduledTime: isoTime,
          error: "Invalid date provided.",
        });
        continue;
      }

      const scheduledSeconds = Math.floor(scheduledDate.getTime() / 1000);

      const leadTimeSeconds = scheduledSeconds - nowInSeconds;

      if (leadTimeSeconds < FACEBOOK_MIN_LEAD_SECONDS) {
        results.push({
          scheduledTime: isoTime,
          error: "Facebook scheduling requires dates at least 10 minutes in the future.",
        });
        continue;
      }

      if (leadTimeSeconds > FACEBOOK_MAX_LEAD_SECONDS) {
        results.push({
          scheduledTime: isoTime,
          error: `Facebook scheduling only allows dates within the next 75 days (requested ~${Math.round(leadTimeSeconds / 86400)} days ahead).`,
        });
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
        results.push({
          scheduledTime: isoTime,
          externalId,
        });
      } catch (error) {
        const errorMessage =
          error instanceof FacebookScheduleError
            ? `${error.message}`
            : error instanceof Error
            ? error.message
            : "Unexpected error while contacting Facebook.";
        if (error instanceof FacebookScheduleError && error.details?.fbtrace_id) {
          results.push({
            scheduledTime: isoTime,
            error: `${errorMessage} [fbtrace ${error.details.fbtrace_id}]`,
          });
          continue;
        }
        results.push({
          scheduledTime: isoTime,
          error: errorMessage,
        });
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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
