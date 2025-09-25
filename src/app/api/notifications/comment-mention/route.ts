import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { EmailNotificationService } from "@/lib/email-notifications";

interface MentionRequestBody {
  projectId: string;
  commentId: string;
  commentText: string;
  mentionedUserIds: string[];
  authorId: string;
}

export async function POST(request: Request) {
  try {
    const requiredEnvVars = [
      "GOOGLE_SERVICE_ACCOUNT_EMAIL",
      "GOOGLE_PRIVATE_KEY_B64",
      "SUPABASE_SERVICE_ROLE_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
    ];

    const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);
    if (missingEnvVars.length > 0) {
      console.error("Missing environment variables:", missingEnvVars);
      return NextResponse.json(
        {
          error: "Server configuration error",
          details:
            process.env.NODE_ENV === "development"
              ? `Missing env vars: ${missingEnvVars.join(", ")}`
              : undefined,
        },
        { status: 500 }
      );
    }

    const body = (await request.json()) as MentionRequestBody;
    const { projectId, commentId, commentText, mentionedUserIds, authorId } = body;

    if (!projectId || !commentId || !commentText || !mentionedUserIds?.length || !authorId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();

    const { data: projectData, error: projectError } = await supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single();

    if (projectError) {
      console.error("Project fetch error", projectError);
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    const { data: authorProfile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", authorId)
      .single();

    const projectName = projectData?.name ?? "Project";
    const authorName = authorProfile?.display_name ?? "Team member";

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const authorUser = await serviceClient.auth.admin.getUserById(authorId);
    const authorEmail = authorUser.data.user?.email ?? "notifications@golcentres.co.uk";

    const emailService = new EmailNotificationService();
    const projectUrl = `${process.env.APP_BASE_URL ?? "https://projects.golcentres.co.uk"}/projects/${projectId}`;

    const uniqueIds = [...new Set(mentionedUserIds)].filter((id) => id !== authorId);
    const results: Array<{ userId: string; success: boolean }> = [];

    for (const userId of uniqueIds) {
      try {
        const userResponse = await serviceClient.auth.admin.getUserById(userId);
        const email = userResponse.data.user?.email;

        if (!email) {
          console.warn("Mentioned user missing email", { userId });
          results.push({ userId, success: false });
          continue;
        }

        const sent = await emailService.sendCommentMentionNotification(
          {
            projectName,
            commentText,
            mentionedToEmail: email,
            authorName,
            projectUrl,
          },
          authorEmail
        );

        results.push({ userId, success: sent });
      } catch (error) {
        console.error("Error notifying mentioned user", { userId, error });
        results.push({ userId, success: false });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error("Mention notification error", error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
