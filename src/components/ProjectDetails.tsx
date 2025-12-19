"use client";

import React, { useEffect, useState, useMemo } from "react";
import type { Project, Task, KPI } from "@/types/database.types";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
  List,
  Columns,
  CalendarClock,
  Target,
} from "lucide-react";
import NewTaskDialog from "./NewTaskDialog";
import EditTaskDialog from "./EditTaskDialog";
import NewKPIDialog from "./NewKPIDialog";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import EditKPIDialog from "./EditKPIDialog";
import { createClient } from "@/utils/supabase/client";
import ProjectComments from "./ProjectComments";
import KanbanBoard from "./KanbanBoard";

interface ProjectDetailsProps {
  id: string;
}

// For sorting columns in Tasks
type TaskSortColumn = "title" | "status" | "assigned_to" | "due_date";
// For sorting columns in KPIs
type KpiSortColumn = "title" | "measure_date";

/**
 * Helper function to format a date string.
 * - If the date is in the past: returns "dd/mm/yy" format
 * - If the date is today: returns "Today"
 * - If the date is tomorrow: returns "Tomorrow"
 * - If within the next 7 days: returns the weekday (e.g., "Monday")
 * - Otherwise: returns the date in "dd/mm/yyyy" format
 */
function formatDateDisplay(dateString: string): string {
  const targetDate = new Date(dateString);
  const now = new Date();
  // Set both to midnight for accurate day difference
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(
    targetDate.getFullYear(),
    targetDate.getMonth(),
    targetDate.getDate()
  );
  const diffDays = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If date is in the past, show DD/MM/YY format
  if (diffDays < 0) {
    return target.toLocaleDateString("en-GB", { 
      day: "2-digit", 
      month: "2-digit", 
      year: "2-digit" 
    });
  }
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Tomorrow";
  if (diffDays < 7) {
    // Return the weekday name, e.g., "Monday"
    return target.toLocaleDateString("en-GB", { weekday: "long" });
  }
  // Otherwise, return dd/mm/yyyy
  return target.toLocaleDateString("en-GB");
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Profiles fetched from the profiles table for assignment options
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);

  // Collapsible states for tasks sections
  const [todoOpen, setTodoOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  
  // View toggle state (list or kanban)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Sorting state for tasks
  const [taskSortConfig, setTaskSortConfig] = useState<{
    column: TaskSortColumn;
    direction: "asc" | "desc";
  }>({
    column: "title",
    direction: "asc",
  });

  // Sorting state for KPIs
  const [kpiSortConfig, setKpiSortConfig] = useState<{
    column: KpiSortColumn;
    direction: "asc" | "desc";
  }>({
    column: "title",
    direction: "asc",
  });

  const supabase = createClient();

  // Fetch project details, tasks, and KPIs
  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single();
        if (projectError) throw projectError;

        // Fetch project tasks (client-side sorting will be applied later)
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", id);
        if (taskError) throw taskError;

        // Fetch project KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from("kpis")
          .select("*")
          .eq("project_id", id);
        if (kpiError) throw kpiError;

        setProject(projectData);
        setTasks(taskData || []);
        setKpis(kpiData || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load project details");
      } finally {
        setLoading(false);
      }
    }
    fetchProjectData();
  }, [id, supabase]);

  // Fetch profiles for assignment options
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase.from("profiles").select("id, display_name");
        if (error) throw error;
        setProfiles(data || []);
      } catch (err) {
        console.error("Error fetching profiles:", err);
      }
    }
    fetchProfiles();
  }, [supabase]);

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

  // Update the task assignment
  const updateTaskAssignee = async (taskId: string, newAssignee: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: newAssignee || null })
        .eq("id", taskId);
      if (error) throw error;
      setTasks((currentTasks) =>
        currentTasks.map((task) =>
          task.id === taskId ? { ...task, assigned_to: newAssignee } : task
        )
      );
    } catch (error) {
      console.error("Error updating task assignee:", error);
    }
  };

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

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId);
      if (error) throw error;
      setTasks((currentTasks) => currentTasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const deleteKPI = async (kpiId: string) => {
    if (!confirm("Are you sure you want to delete this KPI measurement?")) return;
    try {
      const { error } = await supabase.from("kpis").delete().eq("id", kpiId);
      if (error) throw error;
      setKpis((currentKpis) => currentKpis.filter((kpi) => kpi.id !== kpiId));
    } catch (error) {
      console.error("Error deleting KPI:", error);
    }
  };

  // Sorting logic for tasks using useMemo
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks];
    const { column, direction } = taskSortConfig;

    sorted.sort((a, b) => {
      if (column === "title") {
        return a.title.localeCompare(b.title);
      } else if (column === "status") {
        const order: Record<Task["status"], number> = {
          blocked: 1,
          todo: 2,
          in_progress: 3,
          completed: 4,
        };
        return order[a.status] - order[b.status];
      } else if (column === "assigned_to") {
        const getAssignee = (task: Task) => {
          const profile = profiles.find((p) => p.id === task.assigned_to);
          return profile ? profile.display_name : "unassigned";
        };
        return getAssignee(a).localeCompare(getAssignee(b));
      } else if (column === "due_date") {
        const aDate = a.due_date ? new Date(a.due_date).getTime() : 0;
        const bDate = b.due_date ? new Date(b.due_date).getTime() : 0;
        return aDate - bDate;
      }
      return 0;
    });

    return direction === "asc" ? sorted : sorted.reverse();
  }, [tasks, taskSortConfig, profiles]);

  // Sorting logic for KPIs using useMemo
  const sortedKpis = useMemo(() => {
    const sorted = [...kpis];
    const { column, direction } = kpiSortConfig;

    sorted.sort((a, b) => {
      if (column === "title") {
        return a.title.localeCompare(b.title);
      } else if (column === "measure_date") {
        const aDate = new Date(a.measure_date).getTime();
        const bDate = new Date(b.measure_date).getTime();
        return aDate - bDate;
      }
      return 0;
    });

    return direction === "asc" ? sorted : sorted.reverse();
  }, [kpis, kpiSortConfig]);

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
      nextDue: upcoming.length > 0 ? upcoming[0] : null,
    };
  }, [tasks]);

  const kpiStats = useMemo(() => {
    if (kpis.length === 0) {
      return { count: 0, next: null as KPI | null };
    }

    const sorted = [...kpis].sort(
      (a, b) => new Date(a.measure_date).getTime() - new Date(b.measure_date).getTime()
    );
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const upcoming = sorted.find((kpi) => new Date(kpi.measure_date) >= todayStart);

    return {
      count: kpis.length,
      next: upcoming ?? sorted[sorted.length - 1],
    };
  }, [kpis]);

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
      helper: taskStats.completedCount ? "Marked done" : "Ready to make progress",
      icon: CheckCircle,
      iconClasses: "bg-emerald-500/15 text-emerald-600",
    },
    {
      label: "Blocked",
      value: taskStats.blockedCount,
      helper: taskStats.blockedCount ? "Needs attention" : "No blockers",
      icon: AlertTriangle,
      iconClasses: "bg-amber-100 text-amber-600",
    },
    {
      label: "KPIs tracked",
      value: kpiStats.count,
      helper: kpiStats.count ? "Measuring progress" : "Add your first KPI",
      icon: Target,
      iconClasses: "bg-[#09162a]/10 text-[#09162a]",
    },
  ];

  const hasDescription = Boolean(project?.description && project.description.trim().length > 0);

  const nextTaskAssignee = taskStats.nextDue?.assigned_to
    ? profiles.find((profile) => profile.id === taskStats.nextDue?.assigned_to)?.display_name ?? null
    : null;

  const handleTaskSort = (column: TaskSortColumn) => {
    setTaskSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
  };

  const handleKpiSort = (column: KpiSortColumn) => {
    setKpiSortConfig((prev) => {
      if (prev.column === column) {
        return { column, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { column, direction: "asc" };
    });
  };

  const renderSortArrowForTasks = (column: TaskSortColumn) => {
    return taskSortConfig.column === column
      ? taskSortConfig.direction === "asc"
        ? " ▲"
        : " ▼"
      : null;
  };

  const renderSortArrowForKpis = (column: KpiSortColumn) => {
    return kpiSortConfig.column === column
      ? kpiSortConfig.direction === "asc"
        ? " ▲"
        : " ▼"
      : null;
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.28)_0%,_rgba(148,163,184,0.08)_60%,_transparent_100%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-14rem] right-[-20rem] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.22)_0%,_rgba(129,187,38,0.12)_55%,_transparent_100%)] blur-3xl" />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
          <div className="rounded-3xl border border-white/70 bg-white/80 p-8 shadow-xl backdrop-blur">
            <div className="animate-pulse space-y-6">
              <div className="h-8 w-48 rounded-full bg-slate-200/70" />
              <div className="h-16 rounded-2xl bg-slate-100/70" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-20 rounded-2xl bg-slate-100/70" />
                <div className="h-20 rounded-2xl bg-slate-100/70" />
                <div className="h-20 rounded-2xl bg-slate-100/70" />
                <div className="h-20 rounded-2xl bg-slate-100/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50">
        <div className="pointer-events-none absolute -top-40 -left-32 h-[36rem] w-[36rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.28)_0%,_rgba(148,163,184,0.08)_60%,_transparent_100%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-14rem] right-[-20rem] h-[44rem] w-[44rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(56,189,248,0.22)_0%,_rgba(129,187,38,0.12)_55%,_transparent_100%)] blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-lg px-6 py-16">
          <div className="rounded-3xl border border-rose-100 bg-white/85 p-8 text-center shadow-xl backdrop-blur">
            <h2 className="text-xl font-semibold text-[#09162a]">Something went wrong</h2>
            <p className="mt-3 text-sm leading-relaxed text-rose-600">
              {error || "Project not found"}
            </p>
          </div>
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
            <div className="space-y-4">
              <h1 className="text-3xl font-semibold text-[#09162a] leading-tight">{project.name}</h1>
              {hasDescription ? (
                <p className="max-w-3xl text-sm leading-relaxed text-slate-600">{project.description}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Snapshot</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            </div>
            <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
              <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Next key dates</h3>
              <div className="mt-4 space-y-4">
                <div className="rounded-2xl border border-emerald-100/60 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#81bb26]/15 text-[#09162a]">
                      <List className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#09162a]">Next due task</p>
                      {taskStats.nextDue ? (
                        <>
                          <p className="text-xs text-slate-500">
                            {formatDateDisplay(taskStats.nextDue.due_date!)}
                            {nextTaskAssignee ? ` · ${nextTaskAssignee}` : ""}
                          </p>
                          <p className="mt-1 text-sm text-slate-600">{taskStats.nextDue.title}</p>
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">There are no upcoming due dates.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-emerald-100/60 bg-white/90 p-4 shadow-sm backdrop-blur">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#09162a]/10 text-[#09162a]">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#09162a]">Next KPI review</p>
                      {kpiStats.count > 0 && kpiStats.next ? (
                        <>
                          <p className="text-xs text-slate-500">{formatDateDisplay(kpiStats.next.measure_date)}</p>
                          <p className="mt-1 text-sm text-slate-600">{kpiStats.next.title}</p>
                          {kpiStats.next.result ? (
                            <p className="mt-1 text-xs text-slate-500">Latest result: {kpiStats.next.result}</p>
                          ) : null}
                        </>
                      ) : (
                        <p className="text-xs text-slate-500">Add KPIs to start tracking milestones.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#09162a]">Tasks</h2>
              <p className="text-sm text-slate-500">
                {taskStats.openCount} active · {taskStats.completedCount} completed
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex overflow-hidden rounded-lg border border-emerald-100/80 bg-white/80 shadow-sm">
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'list'
                      ? 'bg-[#09162a] text-white shadow-inner'
                      : 'text-[#09162a] hover:bg-[#81bb26]/10'
                  }`}
                >
                  <List className="h-4 w-4" />
                  List
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                    viewMode === 'kanban'
                      ? 'bg-[#09162a] text-white shadow-inner'
                      : 'text-[#09162a] hover:bg-[#81bb26]/10'
                  }`}
                >
                  <Columns className="h-4 w-4" />
                  Kanban
                </button>
              </div>
              <NewTaskDialog
                projectId={project.id}
                onTaskCreated={(newTask: Task) => setTasks((prevTasks) => [newTask, ...prevTasks])}
              />
            </div>
          </div>
          <div className="mt-6">
            {viewMode === 'kanban' ? (
              <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                <KanbanBoard
                  initialData={[
                    {
                      id: 'todo',
                      title: 'To Do',
                      tasks: tasks
                        .filter((task) => task.status === 'todo')
                        .map((task) => ({
                          id: task.id,
                          title: task.title,
                          description: task.description || undefined,
                          assignee: profiles.find((p) => p.id === task.assigned_to)?.display_name,
                          dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                        })),
                    },
                    {
                      id: 'inprogress',
                      title: 'In Progress',
                      tasks: tasks
                        .filter((task) => task.status === 'in_progress')
                        .map((task) => ({
                          id: task.id,
                          title: task.title,
                          description: task.description || undefined,
                          assignee: profiles.find((p) => p.id === task.assigned_to)?.display_name,
                          dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                        })),
                    },
                    {
                      id: 'completed',
                      title: 'Completed',
                      tasks: tasks
                        .filter((task) => task.status === 'completed')
                        .map((task) => ({
                          id: task.id,
                          title: task.title,
                          description: task.description || undefined,
                          assignee: profiles.find((p) => p.id === task.assigned_to)?.display_name,
                          dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                        })),
                    },
                  ]}
                  tasks={tasks}
                  onTaskMove={(taskId: string, fromColumn: string, toColumn: string) => {
                    const statusMap: Record<string, Task['status']> = {
                      todo: 'todo',
                      inprogress: 'in_progress',
                      completed: 'completed',
                    };
                    updateTaskStatus(taskId, statusMap[toColumn]);
                  }}
                  onTaskUpdate={(updatedTask: Task) => {
                    setTasks((currentTasks) =>
                      currentTasks.map((t) => (t.id === updatedTask.id ? updatedTask : t))
                    );
                  }}
                />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setTodoOpen(!todoOpen)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#09162a]">
                        Active tasks ({todoTasks.length})
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">Tasks that still need action</p>
                    </div>
                    {todoOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {todoOpen ? (
                    <div className="mt-4 border border-emerald-100/70">
                      <table className="w-full overflow-hidden rounded-2xl">
                        <thead className="bg-emerald-100 text-emerald-900">
                          <tr>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('title')}
                            >
                              Task{renderSortArrowForTasks('title')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('status')}
                            >
                              Status{renderSortArrowForTasks('status')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('assigned_to')}
                            >
                              Assignee{renderSortArrowForTasks('assigned_to')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('due_date')}
                            >
                              Due{renderSortArrowForTasks('due_date')}
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
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {getTaskStatusIcon(task.status)}
                                  <Select
                                    value={task.status}
                                    className="min-w-[110px] text-xs"
                                    onChange={(event) =>
                                      updateTaskStatus(task.id, event.target.value as Task['status'])
                                    }
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                  </Select>
                                </div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <Select
                                  value={task.assigned_to || ""}
                                  className="min-w-[110px] text-xs"
                                  onChange={(event) => updateTaskAssignee(task.id, event.target.value)}
                                >
                                  <option value="">Unassigned</option>
                                  {profiles.map((profile) => (
                                    <option key={profile.id} value={profile.id}>
                                      {profile.display_name}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                {task.due_date ? formatDateDisplay(task.due_date) : "-"}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <EditTaskDialog
                                    task={task}
                                    onTaskUpdated={(updatedTask: Task) =>
                                      setTasks((currentTasks) =>
                                        currentTasks.map((t) =>
                                          t.id === updatedTask.id ? updatedTask : t
                                        )
                                      )
                                    }
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
                  ) : null}
                </div>
                <div className="rounded-2xl border border-emerald-100/70 bg-white/90 p-4 shadow-sm backdrop-blur-sm">
                  <button
                    type="button"
                    onClick={() => setCompletedOpen(!completedOpen)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-semibold text-[#09162a]">
                        Completed ({completedTasks.length})
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">Recently signed off to-dos</p>
                    </div>
                    {completedOpen ? (
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-500" />
                    )}
                  </button>
                  {completedOpen ? (
                    <div className="mt-4 border border-emerald-100/70">
                      <table className="w-full overflow-hidden rounded-2xl">
                        <thead className="bg-emerald-100 text-emerald-900">
                          <tr>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('title')}
                            >
                              Task{renderSortArrowForTasks('title')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('status')}
                            >
                              Status{renderSortArrowForTasks('status')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('assigned_to')}
                            >
                              Assignee{renderSortArrowForTasks('assigned_to')}
                            </th>
                            <th
                              className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                              onClick={() => handleTaskSort('due_date')}
                            >
                              Completed{renderSortArrowForTasks('due_date')}
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
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <div className="flex items-center gap-2">
                                  {getTaskStatusIcon(task.status)}
                                  <Select
                                    value={task.status}
                                    className="min-w-[110px] text-xs"
                                    onChange={(event) =>
                                      updateTaskStatus(task.id, event.target.value as Task['status'])
                                    }
                                  >
                                    <option value="todo">To Do</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="blocked">Blocked</option>
                                  </Select>
                                </div>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm">
                                <Select
                                  value={task.assigned_to || ""}
                                  className="min-w-[110px] text-xs"
                                  onChange={(event) => updateTaskAssignee(task.id, event.target.value)}
                                >
                                  <option value="">Unassigned</option>
                                  {profiles.map((profile) => (
                                    <option key={profile.id} value={profile.id}>
                                      {profile.display_name}
                                    </option>
                                  ))}
                                </Select>
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                                {task.due_date ? formatDateDisplay(task.due_date) : "-"}
                              </td>
                              <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <EditTaskDialog
                                    task={task}
                                    onTaskUpdated={(updatedTask: Task) =>
                                      setTasks((currentTasks) =>
                                        currentTasks.map((t) =>
                                          t.id === updatedTask.id ? updatedTask : t
                                        )
                                      )
                                    }
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
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-[#09162a]">KPIs</h2>
              <p className="text-sm text-slate-500">
                {kpiStats.count ? `${kpiStats.count} metrics tracked` : "Track the numbers that matter"}
              </p>
            </div>
            <NewKPIDialog
              projectId={project.id}
              onKPICreated={(newKpi: KPI) => setKpis((prevKpis) => [newKpi, ...prevKpis])}
            />
          </div>
          <div className="mt-6">
            {sortedKpis.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-emerald-200/70 bg-white/85 p-6 text-sm text-slate-500 backdrop-blur-sm">
                No KPIs yet. Add your first KPI to start monitoring progress.
              </div>
            ) : (
              <div className="rounded-2xl border border-emerald-100/70 bg-white/90 shadow-sm backdrop-blur-sm">
                <table className="w-full overflow-hidden rounded-2xl">
                  <thead className="bg-emerald-100 text-emerald-900">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleKpiSort('title')}
                      >
                        KPI{renderSortArrowForKpis('title')}
                      </th>
                      <th
                        className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleKpiSort('measure_date')}
                      >
                        Measure Date{renderSortArrowForKpis('measure_date')}
                      </th>
                      <th className="px-6 py-3 text-left text-sm font-medium">Result</th>
                      <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-100 bg-white/95">
                    {sortedKpis.map((kpi) => (
                      <tr key={kpi.id} className="hover:bg-emerald-50/70">
                        <td className="px-6 py-4 text-sm text-gray-900">{kpi.title}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{formatDateDisplay(kpi.measure_date)}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{kpi.result}</td>
                        <td className="px-6 py-4 text-sm text-gray-900 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <EditKPIDialog
                              kpi={kpi}
                              onKPIUpdated={(updatedKpi: KPI) => {
                                setKpis((currentKpis) =>
                                  currentKpis.map((existing) =>
                                    existing.id === updatedKpi.id ? updatedKpi : existing
                                  )
                                );
                              }}
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                              onClick={() => deleteKPI(kpi.id)}
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
            )}
          </div>
        </section>

        <section>
          <div className="rounded-3xl border border-white/60 bg-white/80 p-6 shadow-xl backdrop-blur-xl">
            <ProjectComments projectId={project.id} />
          </div>
        </section>
      </div>
    </div>
  );
}
