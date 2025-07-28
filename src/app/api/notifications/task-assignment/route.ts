import { NextResponse } from "next/server";
import { EmailNotificationService } from "@/lib/email-notifications";
import { createClient } from "@/utils/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";

interface TaskWithProject {
  title: string;
  description: string | null;
  due_date: string | null;
  projects: {
    name: string;
  } | null;
}

export async function POST(request: Request) {
  try {
    // Check required environment variables first
    const requiredEnvVars = [
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'GOOGLE_PRIVATE_KEY_B64',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missingEnvVars.length > 0) {
      console.error('❌ Missing environment variables:', missingEnvVars);
      return NextResponse.json(
        { 
          error: "Server configuration error",
          details: process.env.NODE_ENV === 'development' 
            ? `Missing env vars: ${missingEnvVars.join(', ')}` 
            : undefined
        },
        { status: 500 }
      );
    }

    const { taskId, assignedToUserId, assignedByUserId } = await request.json();
    console.log('📧 Notification request:', { taskId, assignedToUserId, assignedByUserId });

    if (!taskId || !assignedToUserId || !assignedByUserId) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Get task details with project information
    console.log('🔍 Fetching task details for:', taskId);
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select(`
        title,
        description,
        due_date,
        projects (name)
      `)
      .eq('id', taskId)
      .single() as { data: TaskWithProject | null; error: unknown };

    if (taskError) {
      console.error('❌ Task fetch error:', taskError);
      return NextResponse.json(
        { error: "Task not found", details: String(taskError) },
        { status: 404 }
      );
    }

    if (!task) {
      console.error('❌ Task not found');
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    console.log('✅ Task found:', task);

    // Create service client with admin privileges (using service role key)
    console.log('👥 Fetching user emails with service client');
    
    // Check if we have service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      console.error('❌ No service role key found');
      return NextResponse.json(
        { error: "Service role key not configured" },
        { status: 500 }
      );
    }

    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey
    );

    const { data: users, error: usersError } = await serviceClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('❌ Users fetch error with service client:', usersError);
      return NextResponse.json(
        { error: "Failed to fetch user data", details: String(usersError) },
        { status: 500 }
      );
    }

    console.log('✅ Users found:', users.users.length);
    const assignedToUser = users.users.find(u => u.id === assignedToUserId);
    const assignedByUser = users.users.find(u => u.id === assignedByUserId);

    if (!assignedToUser?.email || !assignedByUser?.email) {
      console.error('❌ User emails not found:', { 
        assignedToUser: assignedToUser?.email, 
        assignedByUser: assignedByUser?.email 
      });
      return NextResponse.json(
        { error: "User emails not found" },
        { status: 404 }
      );
    }

    console.log('✅ User emails found:', { 
      assignedTo: assignedToUser.email, 
      assignedBy: assignedByUser.email 
    });

    // Send notification
    console.log('📧 Sending email notification');
    const emailService = new EmailNotificationService();
    const sent = await emailService.sendTaskAssignmentNotification({
      taskTitle: task.title,
      taskDescription: task.description || undefined,
      projectName: task.projects?.name || 'Unknown Project',
      assignedToEmail: assignedToUser.email,
      assignedByEmail: assignedByUser.email,
      dueDate: task.due_date || undefined,
    });

    console.log('✅ Email result:', sent);
    return NextResponse.json({ 
      success: sent,
      message: sent ? "Notification sent successfully" : "Notification skipped (self-assignment)"
    });

  } catch (error) {
    console.error('Notification API error:', error);
    
    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Error details:', { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
      },
      { status: 500 }
    );
  }
}