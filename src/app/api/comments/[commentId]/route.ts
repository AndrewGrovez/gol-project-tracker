import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ commentId: string }> }
) {
  try {
    const missingEnvVars = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"].filter(
      (envVar) => !process.env[envVar]
    );

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

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { commentId } = await params;
    const { data: commentRows, error: commentError } = await serviceClient
      .from("comments")
      .select("id, user_id")
      .eq("id", commentId)
      .limit(1);

    if (commentError) {
      console.error("Comment fetch error", commentError);
      return NextResponse.json({ error: "Failed to fetch comment" }, { status: 500 });
    }

    const comment = commentRows?.[0];
    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete replies first so FK constraints don't block the parent delete.
    const { error: repliesError } = await serviceClient
      .from("comments")
      .delete()
      .eq("parent_comment_id", commentId);

    if (repliesError) {
      console.error("Replies delete error", repliesError);
      return NextResponse.json({ error: "Failed to delete replies" }, { status: 500 });
    }

    const { error: deleteError } = await serviceClient
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (deleteError) {
      console.error("Comment delete error", deleteError);
      return NextResponse.json({ error: "Failed to delete comment" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Comment delete route error", error);
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
