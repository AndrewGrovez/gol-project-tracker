import { NextResponse } from "next/server";
import { createClient as createUserClient } from "@/utils/supabase/server";
import {
  getInstagramPublishingConfigError,
  publishInstagramImageNow,
} from "@/lib/social/instagram-publishing";
import { createClient as createServiceClient } from "@supabase/supabase-js";

const DEFAULT_BATCH_SIZE = 10;
const MAX_BATCH_SIZE = 25;

interface ClaimedInstagramJob {
  id: string;
  caption: string;
  image_url: string;
  scheduled_for: string;
  attempts: number;
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

async function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expectedCronHeader = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : null;

  if (expectedCronHeader && authHeader === expectedCronHeader) {
    return true;
  }

  const supabase = await createUserClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (!error && user) {
    return true;
  }

  return !expectedCronHeader && process.env.NODE_ENV !== "production";
}

async function handleRequest(request: Request) {
  const authorized = await isAuthorized(request);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const configError = getInstagramPublishingConfigError();
  if (configError) {
    return NextResponse.json({ error: configError }, { status: 500 });
  }

  const batchSizeRaw = new URL(request.url).searchParams.get("limit");
  const parsedBatchSize = Number.parseInt(batchSizeRaw ?? `${DEFAULT_BATCH_SIZE}`, 10);
  const batchSize = Number.isFinite(parsedBatchSize)
    ? Math.max(1, Math.min(parsedBatchSize, MAX_BATCH_SIZE))
    : DEFAULT_BATCH_SIZE;

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase.rpc("claim_due_instagram_scheduled_posts", {
    p_limit: batchSize,
  });

  if (error) {
    return NextResponse.json(
      { error: `Failed to claim due Instagram jobs: ${error.message}` },
      { status: 500 }
    );
  }

  const jobs = Array.isArray(data) ? (data as ClaimedInstagramJob[]) : [];

  if (jobs.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      published: 0,
      failed: 0,
      results: [],
    });
  }

  let published = 0;
  let failed = 0;
  const results: Array<{ id: string; scheduledFor: string; status: string; error?: string }> = [];

  for (const job of jobs) {
    try {
      const mediaId = await publishInstagramImageNow(job.caption, job.image_url);

      const { error: updateError } = await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "published",
          published_at: new Date().toISOString(),
          instagram_media_id: mediaId ?? null,
          error_message: null,
        })
        .eq("id", job.id);

      if (updateError) {
        throw new Error(`Publish succeeded but job update failed: ${updateError.message}`);
      }

      published += 1;
      results.push({
        id: job.id,
        scheduledFor: job.scheduled_for,
        status: "published",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Instagram publish failed.";

      await supabase
        .from("instagram_scheduled_posts")
        .update({
          status: "failed",
          error_message: message,
        })
        .eq("id", job.id);

      failed += 1;
      results.push({
        id: job.id,
        scheduledFor: job.scheduled_for,
        status: "failed",
        error: message,
      });
    }
  }

  return NextResponse.json({
    success: failed === 0,
    processed: jobs.length,
    published,
    failed,
    results,
  });
}

export async function GET(request: Request) {
  return handleRequest(request);
}

export async function POST(request: Request) {
  return handleRequest(request);
}
