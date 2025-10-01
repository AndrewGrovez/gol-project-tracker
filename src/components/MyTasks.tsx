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
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "in_progress":
        return <Activity className="w-4 h-4 text-[#81bb26]" />;
      case "todo":
        return <Clock className="w-4 h-4 text-slate-400" />;
      case "blocked":
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
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

  const taskStats = useMemo(() => {
    const open = tasks.filter((task) => task.status !== "completed");
    const completedCount = tasks.filter((task) => task.status === "completed").length;
    const blockedCount = tasks.filter((task) => task.status === "blocked").length;

    const upcoming = open
      .filter((task) => Boolean(task.due_date))
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime());

    return {
      openCount: open.length,
      completedCount,
      blockedCount,
      nextDueTask: upcoming.length > 0 ? upcoming[0] : null,
    };
  }, [tasks]);

  const nextDueHelper = taskStats.nextDueTask?.project?.name
    ? `Project · ${taskStats.nextDueTask.project.name}`
    : "No assignment";

  const highlightCards = [
    {
      label: "Active tasks",
      value: taskStats.openCount,
      helper: taskStats.openCount ? "In motion" : "You're all caught up",
      icon: List,
      iconClasses: "bg-[#81bb26]/15 text-[#09162a]",
    },
    {
      label: "Completed",
      value: taskStats.completedCount,
      helper: taskStats.completedCount ? "Marked done" : "Ready for wins",
      icon: CheckCircle,
      iconClasses: "bg-emerald-500/15 text-emerald-600",
    },
    {
      label: "Blocked",
      value: taskStats.blockedCount,
      helper: taskStats.blockedCount ? "Needs attention" : "Clear runway",
      icon: AlertTriangle,
      iconClasses: "bg-amber-100 text-amber-600",
    },
    {
      label: "Next due",
      value: taskStats.nextDueTask && taskStats.nextDueTask.due_date
        ? new Date(taskStats.nextDueTask.due_date).toLocaleDateString("en-GB")
        : "—",
      helper: taskStats.nextDueTask ? nextDueHelper : "No due dates pending",
      icon: Clock,
      iconClasses: "bg-[#09162a]/10 text-[#09162a]",
    },
  ];

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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.28)_0%,_rgba(148,163,184,0.08)_60%,_transparent_100%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-14rem] right-[-20rem] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.22)_0%,_rgba(129,187,38,0.12)_55%,_transparent_100%)] blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-12 px-6 py-12">
        <section className="flex flex-col gap-6">
          <div className="rounded-3xl border border-white/60 bg-white/85 px-8 py-10 shadow-xl backdrop-blur-xl">
            <div className="space-y-3">
              <h1 className="text-3xl font-semibold text-[#09162a]">My Tasks</h1>
              <p className="text-sm text-slate-600">Everything assigned to you across projects, with quick filters and a kanban view.</p>
            </div>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {highlightCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="flex items-center justify-between rounded-2xl border border-emerald-100/60 bg-white/80 p-4 shadow-sm backdrop-blur"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">{card.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-[#09162a]">{card.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{card.helper}</p>
                  </div>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClasses}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-[#09162a]">Task workspace</h2>
                <p className="text-sm text-slate-500">
                  {filteredTasks.length} task{filteredTasks.length === 1 ? "" : "s"} in view · {projectFilter === "all" ? "All projects" : projectOptions.find(([id]) => id === projectFilter)?.[1] ?? ""}
                </p>
              </div>
              <div className="flex overflow-hidden rounded-lg border border-emerald-100/80 bg-white/80 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "table"
                      ? "bg-[#09162a] text-white shadow-inner"
                      : "text-[#09162a] hover:bg-[#81bb26]/10"
                  }`}
                >
                  <List className="h-4 w-4" />
                  Table
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("kanban")}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === "kanban"
                      ? "bg-[#09162a] text-white shadow-inner"
                      : "text-[#09162a] hover:bg-[#81bb26]/10"
                  }`}
                >
                  <LayoutGrid className="h-4 w-4" />
                  Kanban
                </button>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search tasks"
                aria-label="Search tasks"
                className="h-12 rounded-xl border border-emerald-100/70 bg-white/80 text-sm"
              />
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as TaskStatusFilter)}
                className="h-12 rounded-xl border border-emerald-100/70 bg-white/80 text-sm"
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
                className="h-12 rounded-xl border border-emerald-100/70 bg-white/80 text-sm"
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

            {viewMode === "kanban" ? (
              filteredTasks.length === 0 ? (
                <p className="text-sm text-slate-500">No tasks match your filters.</p>
              ) : (
                <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                  <KanbanBoard
                    initialData={kanbanData}
                    onTaskMove={handleTaskMove}
                    onTaskUpdate={(updatedTask) => {
                      setTasks((currentTasks) =>
                        currentTasks.map((t) =>
                          t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                        )
                      );
                    }}
                    tasks={filteredTasks}
                  />
                </div>
              )
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setTodoOpen(!todoOpen)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#09162a]">Active tasks ({todoTasks.length})</h3>
                      <p className="mt-1 text-xs text-slate-500">Tasks that still need action</p>
                    </div>
                    {todoOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {todoOpen ? (
                    todoTasks.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No tasks match your filters.</p>
                    ) : (
                      <div className="mt-4 border border-emerald-100/70">
                        <table className="w-full overflow-hidden rounded-2xl">
                          <thead className="bg-emerald-100 text-emerald-900">
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
                              <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100 bg-white/95">
                            {todoTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-emerald-50/70">
                                <td className="px-6 py-3 whitespace-normal break-words text-sm text-gray-900">
                                  {task.title}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                                  {task.project.name}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    {getTaskStatusIcon(task.status)}
                                    <Select
                                      value={task.status}
                                      className="min-w-[110px] text-xs"
                                      onChange={(e) =>
                                        updateTaskStatus(task.id, e.target.value as Task["status"])
                                      }
                                    >
                                      <option value="todo">To Do</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="blocked">Blocked</option>
                                    </Select>
                                  </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-700">
                                  {task.due_date
                                    ? new Date(task.due_date).toLocaleDateString("en-GB")
                                    : "-"}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end gap-2">
                                    <EditTaskDialog
                                      task={task}
                                      onTaskUpdated={(updatedTask) => {
                                        setTasks((currentTasks) =>
                                          currentTasks.map((t) =>
                                            t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                                          )
                                        );
                                      }}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
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
                    )
                  ) : null}
                </div>

                <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setCompletedOpen(!completedOpen)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#09162a]">Completed ({completedTasks.length})</h3>
                      <p className="mt-1 text-xs text-slate-500">Recently signed off tasks</p>
                    </div>
                    {completedOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {completedOpen ? (
                    completedTasks.length === 0 ? (
                      <p className="mt-4 text-sm text-slate-500">No tasks match your filters.</p>
                    ) : (
                      <div className="mt-4 border border-emerald-100/70">
                        <table className="w-full overflow-hidden rounded-2xl">
                          <thead className="bg-emerald-100 text-emerald-900">
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
                                Completed{renderSortArrow("due_date")}
                              </th>
                              <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-emerald-100 bg-white/95">
                            {completedTasks.map((task) => (
                              <tr key={task.id} className="hover:bg-emerald-50/70">
                                <td className="px-6 py-3 whitespace-normal break-words text-sm text-gray-900">
                                  {task.title}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-600">
                                  {task.project.name}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm">
                                  <div className="flex items-center gap-2">
                                    {getTaskStatusIcon(task.status)}
                                    <Select
                                      value={task.status}
                                      className="min-w-[110px] text-xs"
                                      onChange={(e) =>
                                        updateTaskStatus(task.id, e.target.value as Task["status"])
                                      }
                                    >
                                      <option value="todo">To Do</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="completed">Completed</option>
                                      <option value="blocked">Blocked</option>
                                    </Select>
                                  </div>
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-sm text-slate-700">
                                  {task.due_date
                                    ? new Date(task.due_date).toLocaleDateString("en-GB")
                                    : "-"}
                                </td>
                                <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                  <div className="flex items-center justify-end gap-2">
                                    <EditTaskDialog
                                      task={task}
                                      onTaskUpdated={(updatedTask) => {
                                        setTasks((currentTasks) =>
                                          currentTasks.map((t) =>
                                            t.id === updatedTask.id ? { ...t, ...updatedTask } : t
                                          )
                                        );
                                      }}
                                    />
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
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
                    )
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
