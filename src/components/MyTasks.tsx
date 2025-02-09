"use client";

import React, { useEffect, useState } from "react";
import type { Task, Project } from "@/types/database.types";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";

export default function MyTasks() {
  const [tasks, setTasks] = useState<(Task & { project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoOpen, setTodoOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function fetchMyTasks() {
      try {
        setLoading(true);
        setError(null);

        // Get the current user's ID
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
          setError("Please log in to view your tasks");
          return;
        }

        // Fetch tasks assigned to the user, including project details
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select(`
            *,
            project:project_id (
              id,
              name,
              status
            )
          `)
          .eq("assigned_to", user.id)
          .order("created_at", { ascending: false });

        if (taskError) throw taskError;
        setTasks(taskData || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchMyTasks();
  }, [supabase]);

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      if (error) throw error;
      setTasks(currentTasks =>
        currentTasks.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
      );
    } catch (error) {
      console.error("Error updating task status:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getStatusIcon = (status: Project["status"]) => {
    const iconClass = "w-5 h-5";
    switch (status) {
      case "completed":
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case "in_progress":
        return <Activity className={`${iconClass} text-blue-500`} />;
      case "not_started":
        return <Clock className={`${iconClass} text-gray-500`} />;
      case "delayed":
        return <AlertTriangle className={`${iconClass} text-red-500`} />;
      default:
        return <Clock className={`${iconClass} text-gray-500`} />;
    }
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
          {[1, 2, 3].map(n => (
            <div key={n} className="mb-4 h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    );
  }

  // Split tasks into "To do" and "Completed tasks"
  const todoTasks = tasks.filter(task => task.status !== "completed");
  const completedTasks = tasks.filter(task => task.status === "completed");

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">My Tasks</h1>

      {/* To do tasks section */}
      <div className="mb-8">
        <div
          className="flex items-center gap-2 cursor-pointer mb-4"
          onClick={() => setTodoOpen(!todoOpen)}
        >
          <h2 className="text-xl font-semibold">To do ({todoTasks.length})</h2>
          {todoOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <ChevronRight className="w-6 h-6" />
          )}
        </div>
        {todoOpen && (
          todoTasks.length === 0 ? (
            <p className="text-gray-500">No tasks assigned to you</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th className="px-6 py-2 text-left text-sm font-medium">Task</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Project</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Due</th>
                    <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {todoTasks.map(task => (
                    <tr key={task.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {task.title}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.project.status)}
                          <span>{task.project.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <Select
                          value={task.status}
                          className="min-w-[100px] text-xs"
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.value as Task["status"])
                          }
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </Select>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Completed tasks section */}
      <div className="mb-8">
        <div
          className="flex items-center gap-2 cursor-pointer mb-4"
          onClick={() => setCompletedOpen(!completedOpen)}
        >
          <h2 className="text-xl font-semibold">
            Completed tasks ({completedTasks.length})
          </h2>
          {completedOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <ChevronRight className="w-6 h-6" />
          )}
        </div>
        {completedOpen && (
          completedTasks.length === 0 ? (
            <p className="text-gray-500">No completed tasks</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th className="px-6 py-2 text-left text-sm font-medium">Task</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Project</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-2 text-left text-sm font-medium">Due</th>
                    <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {completedTasks.map(task => (
                    <tr key={task.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {task.title}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(task.project.status)}
                          <span>{task.project.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        <Select
                          value={task.status}
                          className="min-w-[100px] text-xs"
                          onChange={(e) =>
                            updateTaskStatus(task.id, e.target.value as Task["status"])
                          }
                        >
                          <option value="todo">To Do</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="blocked">Blocked</option>
                        </Select>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                        {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteTask(task.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}