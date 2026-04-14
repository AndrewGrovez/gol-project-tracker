const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_ACCOUNT_ID = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

interface GraphApiError {
  message?: string;
  code?: number;
  error_subcode?: number;
  error_user_msg?: string;
}

const RETRYABLE_PUBLISH_PATTERNS = [
  /not (ready|finished)/i,
  /still processing/i,
  /media builder not found/i,
  /container/i,
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const getInstagramPublishingConfigError = () => {
  if (!IG_ACCESS_TOKEN || !IG_ACCOUNT_ID) {
    return "INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID are not configured.";
  }

  return null;
};

export const mapInstagramGraphError = (error?: GraphApiError) => {
  const combinedMessage = `${error?.message ?? ""} ${error?.error_user_msg ?? ""}`.trim();

  if (error?.code === 3 && /whitelist/i.test(combinedMessage)) {
    return "Instagram native scheduling is not enabled for this app/account. App-side scheduling should publish through the immediate publish flow instead.";
  }

  return error?.error_user_msg || error?.message || "Instagram API request failed.";
};

async function publishContainer(creationId: string) {
  const publishParams = new URLSearchParams({
    creation_id: creationId,
    access_token: IG_ACCESS_TOKEN!,
  });

  const publishRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media_publish`,
    { method: "POST", body: publishParams }
  );

  const publishData = await publishRes.json() as { id?: string; error?: GraphApiError };

  if (!publishRes.ok) {
    throw new Error(mapInstagramGraphError(publishData?.error));
  }

  return publishData.id as string | undefined;
}

export async function publishInstagramImageNow(
  caption: string,
  imageUrl: string
): Promise<string | undefined> {
  const configError = getInstagramPublishingConfigError();
  if (configError) {
    throw new Error(configError);
  }

  const containerParams = new URLSearchParams({
    image_url: imageUrl,
    caption,
    access_token: IG_ACCESS_TOKEN!,
  });

  const containerRes = await fetch(
    `https://graph.facebook.com/v22.0/${IG_ACCOUNT_ID}/media`,
    { method: "POST", body: containerParams }
  );

  const containerData = await containerRes.json() as { id?: string; error?: GraphApiError };

  if (!containerRes.ok) {
    throw new Error(mapInstagramGraphError(containerData?.error));
  }

  const creationId = containerData.id;
  if (!creationId) {
    throw new Error("Instagram did not return a media container ID.");
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await publishContainer(creationId);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Instagram publish failed.";
      const shouldRetry = RETRYABLE_PUBLISH_PATTERNS.some((pattern) => pattern.test(message));

      if (!shouldRetry || attempt === 2) {
        throw error;
      }

      await sleep(3000);
    }
  }

  throw new Error("Instagram publish failed.");
}
