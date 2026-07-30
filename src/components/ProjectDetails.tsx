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
import ProjectDocuments from "./ProjectDocuments";

interface ProjectDetailsProps {
  id: string;
}

// For sorting columns in Tasks
type TaskSortColumn = "title" | "status" | "assigned_to" | "due_date";
// For sorting columns in KPIs
type KpiSortColumn = "title" | "measure_date";
type ProjectDetailsTab = "tasks" | "kpis" | "comments" | "docs";

// One surface + elevation scale for the whole page, so panels read as one system.
const PANEL =
  "rounded-2xl border border-slate-200/70 bg-white/85 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_10px_30px_-18px_rgba(15,23,42,0.35)] backdrop-blur-xl";
const INSET = "rounded-xl border border-slate-200/70 bg-white/70";
const SECTION_LABEL = "text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400";
const TABLE_HEAD = "bg-slate-50/80 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500";
const TABLE_HEAD_CELL =
  "px-4 py-2.5 text-left cursor-pointer select-none transition-colors hover:text-[#1c3145]";
const FIELD =
  "min-w-[120px] rounded-lg border-slate-200 py-1.5 text-xs shadow-none focus:border-[#81bb26] focus:ring-1 focus:ring-[#81bb26]/40";
const DELETE_BTN =
  "border border-slate-200 text-slate-400 transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600";

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
  const [commentCount, setCommentCount] = useState(0);
  const [documentCount, setDocumentCount] = useState(0);
  // Profiles fetched from the profiles table for assignment options
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);

  // Collapsible states for tasks sections
  const [todoOpen, setTodoOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  
  // View toggle state (list or kanban)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [activeTab, setActiveTab] = useState<ProjectDetailsTab>("tasks");

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

  const supabase = useMemo(() => createClient(), []);

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

        const { count: commentCountResult, error: commentCountError } = await supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("project_id", id);

        if (commentCountError) {
          console.error("Error fetching comment count:", commentCountError);
        }

        const { count: documentCountResult, error: documentCountError } = await supabase
          .from("project_documents")
          .select("id", { count: "exact", head: true })
          .eq("project_id", id);

        if (documentCountError) {
          console.error("Error fetching document count:", documentCountError);
        }

        setProject(projectData);
        setTasks(taskData || []);
        setKpis(kpiData || []);
        setCommentCount(commentCountResult ?? 0);
        setDocumentCount(documentCountResult ?? 0);
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

  const totalTaskCount = taskStats.openCount + taskStats.completedCount;
  const completionPct =
    totalTaskCount === 0 ? 0 : Math.round((taskStats.completedCount / totalTaskCount) * 100);

  // Icon tints stay muted; only blocked earns a warning colour, so it reads as the exception.
  const highlightCards = [
    {
      label: "Active tasks",
      value: taskStats.openCount,
      helper: taskStats.openCount ? "In motion" : "You're all caught up",
      icon: List,
      iconClasses: "bg-slate-100 text-[#1c3145]",
    },
    {
      label: "Completed",
      value: taskStats.completedCount,
      helper: taskStats.completedCount ? "Marked done" : "Ready to make progress",
      icon: CheckCircle,
      iconClasses: "bg-[#81bb26]/15 text-[#5f8c1c]",
    },
    {
      label: "Blocked",
      value: taskStats.blockedCount,
      helper: taskStats.blockedCount ? "Needs attention" : "No blockers",
      icon: AlertTriangle,
      iconClasses: taskStats.blockedCount
        ? "bg-amber-100 text-amber-600"
        : "bg-slate-100 text-slate-400",
    },
    {
      label: "KPIs tracked",
      value: kpiStats.count,
      helper: kpiStats.count ? "Measuring progress" : "Add your first KPI",
      icon: Target,
      iconClasses: "bg-slate-100 text-[#1c3145]",
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
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="pointer-events-none absolute -top-48 -left-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.14)_0%,_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-18rem] right-[-22rem] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(28,49,69,0.10)_0%,_transparent_70%)] blur-3xl" />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
          <div className={`${PANEL} p-8`}>
            <div className="animate-pulse space-y-6">
              <div className="h-7 w-56 rounded-lg bg-slate-200/70" />
              <div className="h-14 rounded-xl bg-slate-100/80" />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="h-20 rounded-xl bg-slate-100/80" />
                <div className="h-20 rounded-xl bg-slate-100/80" />
                <div className="h-20 rounded-xl bg-slate-100/80" />
                <div className="h-20 rounded-xl bg-slate-100/80" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50">
        <div className="pointer-events-none absolute -top-48 -left-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.14)_0%,_transparent_70%)] blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-18rem] right-[-22rem] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(28,49,69,0.10)_0%,_transparent_70%)] blur-3xl" />
        <div className="relative z-10 mx-auto w-full max-w-lg px-6 py-16">
          <div className={`${PANEL} border-rose-200/70 p-8 text-center`}>
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
    <div className="relative min-h-screen overflow-x-clip bg-gradient-to-b from-slate-50 via-white to-slate-50">
      <div className="pointer-events-none absolute -top-48 -left-40 h-[38rem] w-[38rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.14)_0%,_transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-18rem] right-[-22rem] h-[46rem] w-[46rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(28,49,69,0.10)_0%,_transparent_70%)] blur-3xl" />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pt-4 pb-8 sm:px-6">
        <section className="flex flex-col gap-4">
          <div className={`${PANEL} px-6 py-5`}>
            <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-4">
              <div className="min-w-0 space-y-2">
                <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.01em] text-[#09162a]">
                  {project.name}
                </h1>
                {hasDescription ? (
                  <p className="max-w-3xl text-sm leading-relaxed text-slate-500">
                    {project.description}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0">
                <p className={SECTION_LABEL}>Progress</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-semibold tabular-nums text-[#09162a]">
                    {completionPct}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {taskStats.completedCount}/{totalTaskCount} tasks
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200/70">
                  <div
                    className="h-full rounded-full bg-[#81bb26] transition-[width] duration-500 ease-out"
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className={`${PANEL} p-5`}>
              <h3 className={SECTION_LABEL}>Snapshot</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {highlightCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <div
                      key={card.label}
                      className={`${INSET} flex items-center justify-between gap-3 p-3.5 transition-colors hover:border-slate-300/70`}
                    >
                      <div className="min-w-0">
                        <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-slate-400">
                          {card.label}
                        </p>
                        <p className="mt-1.5 text-2xl font-semibold leading-none tabular-nums text-[#09162a]">
                          {card.value}
                        </p>
                        <p className="mt-1.5 truncate text-xs text-slate-400">{card.helper}</p>
                      </div>
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${card.iconClasses}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className={`${PANEL} flex flex-col p-5`}>
              <h3 className={SECTION_LABEL}>Next key dates</h3>
              <div className="mt-4 grid flex-1 gap-3 sm:grid-cols-1">
                <div className={`${INSET} p-3.5`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#1c3145]">
                      <List className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-semibold text-[#09162a]">Next due task</p>
                        {taskStats.nextDue ? (
                          <span className="text-xs text-slate-400">
                            {formatDateDisplay(taskStats.nextDue.due_date!)}
                            {nextTaskAssignee ? ` · ${nextTaskAssignee}` : ""}
                          </span>
                        ) : null}
                      </div>
                      {taskStats.nextDue ? (
                        <p className="mt-1 text-sm leading-relaxed text-slate-600">
                          {taskStats.nextDue.title}
                        </p>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">No upcoming due dates.</p>
                      )}
                    </div>
                  </div>
                </div>
                <div className={`${INSET} p-3.5`}>
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[#1c3145]">
                      <CalendarClock className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <p className="text-sm font-semibold text-[#09162a]">Next KPI review</p>
                        {kpiStats.count > 0 && kpiStats.next ? (
                          <span className="text-xs text-slate-400">
                            {formatDateDisplay(kpiStats.next.measure_date)}
                          </span>
                        ) : null}
                      </div>
                      {kpiStats.count > 0 && kpiStats.next ? (
                        <>
                          <p className="mt-1 text-sm leading-relaxed text-slate-600">
                            {kpiStats.next.title}
                          </p>
                          {kpiStats.next.result ? (
                            <p className="mt-1 text-xs text-slate-400">
                              Latest result: {kpiStats.next.result}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-slate-400">
                          Add KPIs to start tracking milestones.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className={`${PANEL} overflow-hidden`}>
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200/70 px-3 pt-2">
              {(
                [
                  { key: "tasks", label: "Tasks", count: tasks.length },
                  { key: "kpis", label: "KPIs", count: kpis.length },
                  { key: "comments", label: "Comments", count: commentCount },
                  { key: "docs", label: "Docs & Sheets", count: documentCount },
                ] as { key: ProjectDetailsTab; label: string; count: number }[]
              ).map((tab) => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    aria-current={isActive ? "page" : undefined}
                    className={`relative -mb-px flex items-center gap-2 rounded-t-lg px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? "text-[#09162a]"
                        : "text-slate-400 hover:bg-slate-50/80 hover:text-slate-600"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`inline-flex min-w-[1.375rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums transition-colors ${
                        isActive ? "bg-[#1c3145]/8 text-[#1c3145]" : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                    <span
                      aria-hidden
                      className={`absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-opacity ${
                        isActive ? "bg-[#81bb26] opacity-100" : "opacity-0"
                      }`}
                    />
                  </button>
                );
              })}
            </div>

            <div className="p-5">
              {activeTab === "tasks" ? (
                <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#09162a]">Tasks</h2>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {taskStats.openCount} active · {taskStats.completedCount} completed
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5">
                    <button
                      type="button"
                      onClick={() => setViewMode("list")}
                      className={`flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "list"
                          ? "bg-white text-[#09162a] shadow-sm"
                          : "text-slate-500 hover:text-[#09162a]"
                      }`}
                    >
                      <List className="h-4 w-4" />
                      List
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode("kanban")}
                      className={`flex items-center gap-1.5 rounded-[7px] px-3 py-1.5 text-sm font-medium transition-colors ${
                        viewMode === "kanban"
                          ? "bg-white text-[#09162a] shadow-sm"
                          : "text-slate-500 hover:text-[#09162a]"
                      }`}
                    >
                      <Columns className="h-4 w-4" />
                      Kanban
                    </button>
                  </div>
                  <NewTaskDialog
                    projectId={project.id}
                    onTaskCreated={(newTask: Task) =>
                      setTasks((prevTasks) => [newTask, ...prevTasks])
                    }
                  />
                </div>
              </div>
              <div className="mt-4">
                {viewMode === "kanban" ? (
                  <div className={`${INSET} p-3`}>
                    <KanbanBoard
                      initialData={[
                        {
                          id: "todo",
                          title: "To Do",
                          tasks: tasks
                            .filter((task) => task.status === "todo")
                            .map((task) => ({
                              id: task.id,
                              title: task.title,
                              description: task.description || undefined,
                              assignee: profiles.find((p) => p.id === task.assigned_to)
                                ?.display_name,
                              dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                            })),
                        },
                        {
                          id: "inprogress",
                          title: "In Progress",
                          tasks: tasks
                            .filter((task) => task.status === "in_progress")
                            .map((task) => ({
                              id: task.id,
                              title: task.title,
                              description: task.description || undefined,
                              assignee: profiles.find((p) => p.id === task.assigned_to)
                                ?.display_name,
                              dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                            })),
                        },
                        {
                          id: "completed",
                          title: "Completed",
                          tasks: tasks
                            .filter((task) => task.status === "completed")
                            .map((task) => ({
                              id: task.id,
                              title: task.title,
                              description: task.description || undefined,
                              assignee: profiles.find((p) => p.id === task.assigned_to)
                                ?.display_name,
                              dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                            })),
                        },
                      ]}
                      tasks={tasks}
                      onTaskMove={(taskId: string, fromColumn: string, toColumn: string) => {
                        const statusMap: Record<string, Task["status"]> = {
                          todo: "todo",
                          inprogress: "in_progress",
                          completed: "completed",
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
                  <div className="space-y-3">
                    <div className={`${INSET} overflow-hidden`}>
                      <button
                        type="button"
                        onClick={() => setTodoOpen(!todoOpen)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/70"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[#09162a]">
                            Active tasks
                            <span className="ml-2 text-slate-400 tabular-nums">{todoTasks.length}</span>
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-400">Tasks that still need action</p>
                        </div>
                        {todoOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </button>
                      {todoOpen ? (
                        <div className="overflow-x-auto border-t border-slate-200/70">
                          <table className="w-full">
                            <thead className={TABLE_HEAD}>
                              <tr>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("title")}
                                >
                                  Task{renderSortArrowForTasks("title")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("status")}
                                >
                                  Status{renderSortArrowForTasks("status")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("assigned_to")}
                                >
                                  Assignee{renderSortArrowForTasks("assigned_to")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("due_date")}
                                >
                                  Due{renderSortArrowForTasks("due_date")}
                                </th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {todoTasks.map((task) => (
                                <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                                  <td className="px-4 py-2.5 whitespace-normal break-words text-sm font-medium text-[#09162a]">
                                    {task.title}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-2">
                                      {getTaskStatusIcon(task.status)}
                                      <Select
                                        value={task.status}
                                        className={FIELD}
                                        onChange={(event) =>
                                          updateTaskStatus(
                                            task.id,
                                            event.target.value as Task["status"]
                                          )
                                        }
                                      >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="blocked">Blocked</option>
                                      </Select>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                                    <Select
                                      value={task.assigned_to || ""}
                                      className={FIELD}
                                      onChange={(event) =>
                                        updateTaskAssignee(task.id, event.target.value)
                                      }
                                    >
                                      <option value="">Unassigned</option>
                                      {profiles.map((profile) => (
                                        <option key={profile.id} value={profile.id}>
                                          {profile.display_name}
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm tabular-nums text-slate-500">
                                    {task.due_date ? formatDateDisplay(task.due_date) : "-"}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium">
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
                                        className={DELETE_BTN}
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
                    <div className={`${INSET} overflow-hidden`}>
                      <button
                        type="button"
                        onClick={() => setCompletedOpen(!completedOpen)}
                        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50/70"
                      >
                        <div>
                          <h3 className="text-sm font-semibold text-[#09162a]">
                            Completed
                            <span className="ml-2 text-slate-400 tabular-nums">
                              {completedTasks.length}
                            </span>
                          </h3>
                          <p className="mt-0.5 text-xs text-slate-400">Recently signed off to-dos</p>
                        </div>
                        {completedOpen ? (
                          <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" />
                        )}
                      </button>
                      {completedOpen ? (
                        <div className="overflow-x-auto border-t border-slate-200/70">
                          <table className="w-full">
                            <thead className={TABLE_HEAD}>
                              <tr>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("title")}
                                >
                                  Task{renderSortArrowForTasks("title")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("status")}
                                >
                                  Status{renderSortArrowForTasks("status")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("assigned_to")}
                                >
                                  Assignee{renderSortArrowForTasks("assigned_to")}
                                </th>
                                <th
                                  className={TABLE_HEAD_CELL}
                                  onClick={() => handleTaskSort("due_date")}
                                >
                                  Completed{renderSortArrowForTasks("due_date")}
                                </th>
                                <th className="px-4 py-2.5 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {completedTasks.map((task) => (
                                <tr key={task.id} className="transition-colors hover:bg-slate-50/70">
                                  <td className="px-4 py-2.5 whitespace-normal break-words text-sm text-slate-500">
                                    {task.title}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                                    <div className="flex items-center gap-2">
                                      {getTaskStatusIcon(task.status)}
                                      <Select
                                        value={task.status}
                                        className={FIELD}
                                        onChange={(event) =>
                                          updateTaskStatus(
                                            task.id,
                                            event.target.value as Task["status"]
                                          )
                                        }
                                      >
                                        <option value="todo">To Do</option>
                                        <option value="in_progress">In Progress</option>
                                        <option value="completed">Completed</option>
                                        <option value="blocked">Blocked</option>
                                      </Select>
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm">
                                    <Select
                                      value={task.assigned_to || ""}
                                      className={FIELD}
                                      onChange={(event) =>
                                        updateTaskAssignee(task.id, event.target.value)
                                      }
                                    >
                                      <option value="">Unassigned</option>
                                      {profiles.map((profile) => (
                                        <option key={profile.id} value={profile.id}>
                                          {profile.display_name}
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-sm tabular-nums text-slate-500">
                                    {task.due_date ? formatDateDisplay(task.due_date) : "-"}
                                  </td>
                                  <td className="px-4 py-2.5 whitespace-nowrap text-right text-sm font-medium">
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
                                        className={DELETE_BTN}
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
            </div>
          ) : null}

              {activeTab === "kpis" ? (
                <div>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold tracking-[-0.01em] text-[#09162a]">KPIs</h2>
                  <p className="mt-0.5 text-sm text-slate-400">
                    {kpiStats.count ? `${kpiStats.count} metrics tracked` : "Track the numbers that matter"}
                  </p>
                </div>
                <NewKPIDialog
                  projectId={project.id}
                  onKPICreated={(newKpi: KPI) => setKpis((prevKpis) => [newKpi, ...prevKpis])}
                />
              </div>
              <div className="mt-4">
                {sortedKpis.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300/80 bg-slate-50/50 px-4 py-8 text-center text-sm text-slate-400">
                    No KPIs yet. Add your first KPI to start monitoring progress.
                  </div>
                ) : (
                  <div className={`${INSET} overflow-hidden`}>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className={TABLE_HEAD}>
                        <tr>
                          <th
                            className={TABLE_HEAD_CELL}
                            onClick={() => handleKpiSort("title")}
                          >
                            KPI{renderSortArrowForKpis("title")}
                          </th>
                          <th
                            className={TABLE_HEAD_CELL}
                            onClick={() => handleKpiSort("measure_date")}
                          >
                            Measure Date{renderSortArrowForKpis("measure_date")}
                          </th>
                          <th className="px-4 py-2.5 text-left">Result</th>
                          <th className="px-4 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {sortedKpis.map((kpi) => (
                          <tr key={kpi.id} className="transition-colors hover:bg-slate-50/70">
                            <td className="px-4 py-2.5 text-sm font-medium text-[#09162a]">{kpi.title}</td>
                            <td className="px-4 py-2.5 text-sm tabular-nums text-slate-500">
                              {formatDateDisplay(kpi.measure_date)}
                            </td>
                            <td className="px-4 py-2.5 text-sm text-slate-600">{kpi.result}</td>
                            <td className="px-4 py-2.5 text-right text-sm">
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
                                  className={DELETE_BTN}
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
                  </div>
                )}
              </div>
            </div>
          ) : null}

              {activeTab === "comments" ? (
                <ProjectComments projectId={project.id} onCountChange={setCommentCount} />
              ) : null}

              {activeTab === "docs" ? (
                <ProjectDocuments projectId={project.id} onCountChange={setDocumentCount} />
              ) : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
