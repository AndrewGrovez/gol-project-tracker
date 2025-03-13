"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Clock, AlertTriangle, Activity, MessageSquare } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import type { Project, Task, Comment } from "@/types/database.types";

interface DashboardContentProps {
  userId: string;
}

interface TaskWithProject extends Task {
  project: {
    name: string;
    id: string;
  };
}

interface CommentWithDetails extends Comment {
  project: {
    name: string;
    id: string;
  };
  author_name: string;
}

interface ProjectSummary {
  notStarted: number;
  inProgress: number;
  completed: number;
  delayed: number;
  total: number;
}

interface TaskSummary {
  todo: number;
  inProgress: number;
  completed: number;
  blocked: number;
  total: number;
  dueSoon: TaskWithProject[];
}

export default function DashboardContent({ userId }: DashboardContentProps) {
  const [loading, setLoading] = useState(true);
  const [projectSummary, setProjectSummary] = useState<ProjectSummary>({
    notStarted: 0,
    inProgress: 0,
    completed: 0,
    delayed: 0,
    total: 0,
  });
  const [taskSummary, setTaskSummary] = useState<TaskSummary>({
    todo: 0,
    inProgress: 0,
    completed: 0,
    blocked: 0,
    total: 0,
    dueSoon: [],
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentComments, setRecentComments] = useState<CommentWithDetails[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function fetchDashboardData() {
      setLoading(true);
      try {
        // Fetch all projects the user has access to
        const { data: projects } = await supabase
          .from("projects")
          .select("*")
          .contains("allowed_users", [userId])
          .order("updated_at", { ascending: false });

        // Calculate project summary
        const projectsData = projects || [];
        const projectStats: ProjectSummary = {
          notStarted: 0,
          inProgress: 0,
          completed: 0,
          delayed: 0,
          total: projectsData.length,
        };

        projectsData.forEach((project: Project) => {
          if (project.completed) {
            projectStats.completed++;
          } else if (project.status === "not_started") {
            projectStats.notStarted++;
          } else if (project.status === "in_progress") {
            projectStats.inProgress++;
          } else if (project.status === "delayed") {
            projectStats.delayed++;
          }
        });

        setProjectSummary(projectStats);
        setRecentProjects(projectsData.slice(0, 5)); // Get 5 most recent projects

        // Fetch tasks assigned to the user
        const { data: tasks } = await supabase
          .from("tasks")
          .select(
            `
            *,
            project:project_id (
              id,
              name
            )
          `
          )
          .eq("assigned_to", userId);

        // Calculate task summary
        const tasksData = tasks || [];
        const taskStats: TaskSummary = {
          todo: 0,
          inProgress: 0,
          completed: 0,
          blocked: 0,
          total: tasksData.length,
          dueSoon: [],
        };

        const now = new Date();
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(now.getDate() + 3);

        tasksData.forEach((task: TaskWithProject) => {
          if (task.status === "todo") {
            taskStats.todo++;
          } else if (task.status === "in_progress") {
            taskStats.inProgress++;
          } else if (task.status === "completed") {
            taskStats.completed++;
          } else if (task.status === "blocked") {
            taskStats.blocked++;
          }

          // Check if task is due today or within the next 3 days and not completed
          if (
            task.due_date &&
            task.status !== "completed" &&
            new Date(task.due_date) <= threeDaysFromNow &&
            new Date(task.due_date).setHours(0, 0, 0, 0) >= now.setHours(0, 0, 0, 0)
          ) {
            taskStats.dueSoon.push(task);
          }
        });

        // Sort tasks by due date (ascending)
        taskStats.dueSoon.sort((a, b) => {
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        });

        setTaskSummary(taskStats);

        // Fetch recent comments from projects the user has access to
        const projectIds = projectsData.map((project: Project) => project.id);
        if (projectIds.length > 0) {
          const { data: comments } = await supabase
            .from("comments")
            .select(`
              *,
              project:project_id (
                id,
                name
              )
            `)
            .in("project_id", projectIds)
            .order("created_at", { ascending: false })
            .limit(10);

          if (comments) {
            // Fetch author names for the comments
            const userIds = [...new Set(comments.map(c => c.user_id))];
            const { data: profiles } = await supabase
              .from("profiles")
              .select("id, display_name")
              .in("id", userIds);

            // Create a map of user IDs to names
            const userMap = new Map(profiles?.map(p => [p.id, p.display_name]) || []);

            // Add author names to comments
            const commentsWithAuthors = comments.map(comment => ({
              ...comment,
              author_name: userMap.get(comment.user_id) || 'Unknown User'
            }));

            setRecentComments(commentsWithAuthors);
          }
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [supabase, userId]);

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-32 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-100 rounded-xl"></div>
        </div>
      </div>
    );
  }

  // Format date for display
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  // Format relative time (e.g., "2 days ago", "5 hours ago")
  function formatRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffMins > 0) {
      return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else {
      return 'Just now';
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Project Summary Card */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-[#1c3145]">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-[#1c3145]" />
              Projects
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{projectSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Completed:</span>
                <span className="font-medium text-green-600">{projectSummary.completed}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Summary Card */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-[#81bb26]">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <CheckCircle className="w-5 h-5 mr-2 text-[#81bb26]" />
              Your Tasks
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total:</span>
                <span className="font-medium">{taskSummary.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">To Do:</span>
                <span className="font-medium text-gray-600">{taskSummary.todo}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Progress Status Card */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-indigo-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="w-5 h-5 mr-2 text-indigo-500" />
              Progress Status
            </h3>
            <div className="flex flex-col items-center justify-center h-24">
              <div className="text-4xl font-bold">
                {taskSummary.total > 0
                  ? Math.round((taskSummary.completed / taskSummary.total) * 100)
                  : 0}
                <span className="text-lg text-gray-600">%</span>
              </div>
              <p className="text-gray-600 mt-2">Task Completion Rate</p>
            </div>
          </CardContent>
        </Card>

        {/* Due Soon Card */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-amber-500">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-amber-500" />
              Due Soon
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tasks Due Soon:</span>
                <span className="font-medium">{taskSummary.dueSoon.length}</span>
              </div>
              {taskSummary.dueSoon.length > 0 ? (
                <div className="mt-2">
                  <div className="text-sm font-medium text-amber-700">
                    Next: {taskSummary.dueSoon[0].title.slice(0, 20)}
                    {taskSummary.dueSoon[0].title.length > 20 ? "..." : ""}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {taskSummary.dueSoon[0].due_date
                      ? formatDate(taskSummary.dueSoon[0].due_date)
                      : "No date"}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600">No upcoming deadlines</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tasks Due Soon Section */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">Tasks Due Soon</h3>
            {taskSummary.dueSoon.length > 0 ? (
              <div className="space-y-4">
                {taskSummary.dueSoon.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${task.project_id}`)}
                  >
                    <div className="font-medium">{task.title}</div>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="text-gray-600">
                        Project: {task.project.name}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          new Date(task.due_date || "").toDateString() ===
                          new Date().toDateString()
                            ? "bg-red-100 text-red-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {task.due_date ? formatDate(task.due_date) : "No date"}
                      </span>
                    </div>
                  </div>
                ))}
                {taskSummary.dueSoon.length > 5 && (
                  <div className="text-center text-sm text-gray-600 mt-2">
                    +{taskSummary.dueSoon.length - 5} more tasks due soon
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-600 py-4 text-center">
                No tasks due in the next 3 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects Section */}
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4">Recent Projects</h3>
            {recentProjects.length > 0 ? (
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div
                    key={project.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${project.id}`)}
                  >
                    <div className="flex items-center">
                      {project.status === "completed" ? (
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      ) : project.status === "in_progress" ? (
                        <Activity className="w-4 h-4 text-blue-500 mr-2" />
                      ) : project.status === "delayed" ? (
                        <AlertTriangle className="w-4 h-4 text-red-500 mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 text-gray-500 mr-2" />
                      )}
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      {project.description
                        ? project.description.slice(0, 60) +
                          (project.description.length > 60 ? "..." : "")
                        : "No description"}
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                      <span>
                        Last updated: {formatDate(project.updated_at)}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full ${
                          project.completed
                            ? "bg-green-100 text-green-800"
                            : project.status === "in_progress"
                            ? "bg-blue-100 text-blue-800"
                            : project.status === "delayed"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {project.completed
                          ? "Completed"
                          : project.status
                              .replace("_", " ")
                              .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 py-4 text-center">
                No recent projects found
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Comments Section */}
      <div className="mt-6">
        <Card className="shadow-md hover:shadow-lg transition-all duration-300">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-purple-500" />
              Recent Comments
            </h3>
            {recentComments.length > 0 ? (
              <div className="space-y-4">
                {recentComments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                    onClick={() => router.push(`/projects/${comment.project_id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{comment.author_name}</span>
                      <span className="text-xs text-gray-500">
                        {formatRelativeTime(comment.created_at)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-800 mt-2">
                      {comment.content.length > 100
                        ? comment.content.slice(0, 100) + "..."
                        : comment.content}
                    </div>
                    <div className="text-xs text-gray-600 mt-2">
                      Project: {comment.project.name}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-600 py-4 text-center">
                No recent comments found
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}