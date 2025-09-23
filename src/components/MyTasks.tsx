"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { Task, Project } from "@/types/database.types";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  List,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import EditTaskDialog from "@/components/EditTaskDialog";
import KanbanBoard from "@/components/KanbanBoard";
import { Input } from "@/components/ui/input";

type TaskSortColumn = "title" | "project" | "status" | "due_date";
type TaskStatusFilter = "all" | "todo" | "in_progress" | "completed" | "blocked";

export default function MyTasks() {
  const [tasks, setTasks] = useState<(Task & { project: Project })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoOpen, setTodoOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false); // Changed to false to collapse by default
  const [viewMode, setViewMode] = useState<"table" | "kanban">("kanban");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatusFilter>("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  // Updated default sort config to due_date
  const [taskSortConfig, setTaskSortConfig] = useState<{
    column: TaskSortColumn;
    direction: "asc" | "desc";
  }>({ column: "due_date", direction: "asc" });

  const supabase = createClient();

  const projectOptions = useMemo(() => {
    const entries = new Map<string, string>();
    tasks.forEach((task) => {
      if (task.project) {
        entries.set(task.project.id, task.project.name);
      }
    });
    return Array.from(entries.entries());
  }, [tasks]);

  useEffect(() => {
    async function fetchMyTasks() {
      try {
        setLoading(true);
        setError(null);

        // Get the current user's ID
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) throw userError;

        if (!user) {
          setError("Please log in to view your tasks");
          return;
        }

        // Fetch tasks assigned to the user, including project details
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select(
            `
            *,
            project:project_id (
              id,
              name,
              status
            )
          `
          )
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

  // Update task status function remains unchanged
  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId);
      if (error) throw error;
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
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
      setTasks((currentTasks) =>
        currentTasks.filter((task) => task.id !== taskId)
      );
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  // Handle task move in kanban
  const handleTaskMove = async (taskId: string, fromColumn: string, toColumn: string) => {
    const statusMap: Record<string, Task["status"]> = {
      'todo': 'todo',
      'inprogress': 'in_progress',
      'completed': 'completed'
    };
    
    const newStatus = statusMap[toColumn];
    if (newStatus) {
      await updateTaskStatus(taskId, newStatus);
    }
  };

  // Prepare kanban data
  const filteredTasks = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch = term.length === 0
        ? true
        : [task.title, task.description ?? "", task.project?.name ?? ""].some((value) =>
            value.toLowerCase().includes(term)
          );

      const matchesStatus =
        statusFilter === "all" ? true : task.status === statusFilter;

      const matchesProject =
        projectFilter === "all" ? true : task.project?.id === projectFilter;

      return matchesSearch && matchesStatus && matchesProject;
    });
  }, [tasks, searchTerm, statusFilter, projectFilter]);

  const kanbanData = useMemo(() => {
    const todoTasks = filteredTasks.filter(task => task.status === 'todo').map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignee: task.project.name,
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined
    }));

    const inProgressTasks = filteredTasks.filter(task => task.status === 'in_progress').map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignee: task.project.name,
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined
    }));

    const completedTasks = filteredTasks.filter(task => task.status === 'completed').map(task => ({
      id: task.id,
      title: task.title,
      description: task.description || '',
      assignee: task.project.name,
      dueDate: task.due_date ? new Date(task.due_date).toLocaleDateString() : undefined
    }));

    return [
      {
        id: 'todo',
        title: 'To Do',
        tasks: todoTasks
      },
      {
        id: 'inprogress',
        title: 'In Progress',
        tasks: inProgressTasks
      },
      {
        id: 'completed',
        title: 'Completed',
        tasks: completedTasks
      }
    ];
  }, [filteredTasks]);

  // Helper to render status icon
  const getTaskStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "in_progress":
        return <Activity className="w-4 h-4 text-blue-500" />;
      case "todo":
        return <Clock className="w-4 h-4 text-gray-500" />;
      case "blocked":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Sorting logic: sort tasks based on the current sort configuration
  const sortedTasks = useMemo(() => {
    const sorted = [...filteredTasks];
    const { column, direction } = taskSortConfig;
    sorted.sort((a, b) => {
      if (column === "title") {
        return a.title.localeCompare(b.title);
      } else if (column === "project") {
        return a.project.name.localeCompare(b.project.name);
      } else if (column === "status") {
        const order: Record<Task["status"], number> = {
          todo: 1,
          in_progress: 2,
          completed: 3,
          blocked: 4,
        };
        return order[a.status] - order[b.status];
      } else if (column === "due_date") {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        return aDate - bDate;
      }
      return 0;
    });
    if (direction === "desc") {
      sorted.reverse();
    }
    return sorted;
  }, [filteredTasks, taskSortConfig]);

  // Filter tasks into To do and Completed sections after sorting
  const todoTasks = sortedTasks.filter((task) => task.status !== "completed");
  const completedTasks = sortedTasks.filter((task) => task.status === "completed");

  // Function to handle sorting on header click
  const handleTaskSort = (column: TaskSortColumn) => {
    setTaskSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
  };

  // Helper to render sort arrow
  const renderSortArrow = (column: TaskSortColumn) => {
    if (taskSortConfig.column === column) {
      return taskSortConfig.direction === "asc" ? " ▲" : " ▼";
    }
    return "";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-64 bg-gray-200 rounded mb-6"></div>
          {[1, 2, 3].map((n) => (
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-6 mb-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="flex items-center gap-2"
            >
              <List className="w-4 h-4" />
              Table
            </Button>
            <Button
              variant={viewMode === "kanban" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("kanban")}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search tasks"
            aria-label="Search tasks"
            className="w-full md:w-72"
          />
          <Select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as TaskStatusFilter)}
            className="w-full md:w-44"
            aria-label="Filter tasks by status"
          >
            <option value="all">All statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="blocked">Blocked</option>
          </Select>
          <Select
            value={projectFilter}
            onChange={(event) => setProjectFilter(event.target.value)}
            className="w-full md:w-48"
            aria-label="Filter tasks by project"
          >
            <option value="all">All projects</option>
            {projectOptions.map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {viewMode === "kanban" ? (
        filteredTasks.length === 0 ? (
          <p className="text-gray-500">No tasks match your filters.</p>
        ) : (
          <KanbanBoard
            initialData={kanbanData}
            onTaskMove={handleTaskMove}
            onTaskUpdate={(updatedTask) => {
              setTasks((currentTasks) =>
                currentTasks.map((t) =>
                  t.id === updatedTask.id ? {...t, ...updatedTask} : t
                )
              );
            }}
            tasks={filteredTasks}
          />
        )
      ) : (
        <>
          {/* To do tasks section */}
      <section className="mb-8">
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
        {todoOpen &&
          (todoTasks.length === 0 ? (
            <p className="text-gray-500">No tasks match your filters.</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("title")}
                    >
                      Task{renderSortArrow("title")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("project")}
                    >
                      Project{renderSortArrow("project")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("status")}
                    >
                      Status{renderSortArrow("status")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("due_date")}
                    >
                      Due{renderSortArrow("due_date")}
                    </th>
                    <th className="px-6 py-2 text-right text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {todoTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                        {task.title}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {task.project.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm flex items-center gap-2">
                        {getTaskStatusIcon(task.status)}
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
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <EditTaskDialog
                            task={task}
                            onTaskUpdated={(updatedTask) => {
                              setTasks((currentTasks) =>
                                currentTasks.map((t) =>
                                  t.id === updatedTask.id ? {...t, ...updatedTask} : t
                                )
                              );
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>

      <hr className="mb-8 border-gray-300" />

      {/* Completed tasks section */}
      <section className="mb-8">
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
        {completedOpen &&
          (completedTasks.length === 0 ? (
            <p className="text-gray-500">No tasks match your filters.</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("title")}
                    >
                      Task{renderSortArrow("title")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("project")}
                    >
                      Project{renderSortArrow("project")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("status")}
                    >
                      Status{renderSortArrow("status")}
                    </th>
                    <th
                      className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleTaskSort("due_date")}
                    >
                      Due{renderSortArrow("due_date")}
                    </th>
                    <th className="px-6 py-2 text-right text-sm font-medium">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {completedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                        {task.title}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm">
                        {task.project.name}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm flex items-center gap-2">
                        {getTaskStatusIcon(task.status)}
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
                        {task.due_date
                          ? new Date(task.due_date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end items-center gap-2">
                          <EditTaskDialog
                            task={task}
                            onTaskUpdated={(updatedTask) => {
                              setTasks((currentTasks) =>
                                currentTasks.map((t) =>
                                  t.id === updatedTask.id ? {...t, ...updatedTask} : t
                                )
                              );
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                            onClick={() => deleteTask(task.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </section>
        </>
      )}
    </div>
  );
}
