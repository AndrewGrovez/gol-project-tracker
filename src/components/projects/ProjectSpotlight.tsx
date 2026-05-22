"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Project } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import NewProjectDialog from "@/components/NewProjectDialog";

import SpotlightBackground from "./SpotlightBackground";
import FocusHero from "./FocusHero";
import ProgressRingCard from "./ProgressRingCard";
import TodayFocusList, { type FocusTask } from "./TodayFocusList";
import Filmstrip from "./Filmstrip";
import BoardView from "./BoardView";
import { useSpotlightKeyboard } from "./useSpotlightKeyboard";
import { BRAND, deriveProjectMeta } from "./spotlight-config";

type ExtendedProject = Project & { allowed_users?: string[] | null };

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
};

type Profile = { id: string; display_name: string };

const FOCUS_STORAGE_KEY = "spotlight:focusId";
const VIEW_STORAGE_KEY = "spotlight:viewMode";
type ViewMode = "focus" | "board";

export default function ProjectSpotlight() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [focusTasks, setFocusTasks] = useState<FocusTask[]>([]);
  const [focusTasksLoading, setFocusTasksLoading] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [focusId, setFocusId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("focus");
  const newProjectWrapperRef = useRef<HTMLDivElement>(null);
  const emptyStateWrapperRef = useRef<HTMLDivElement>(null);

  // Auth
  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/login");
        return;
      }
      setCurrentUserId(data.session.user.id);
    };
    run();
  }, [router, supabase]);

  // Load projects and profiles + tasks once we have a user
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [projectsRes, profilesRes, tasksRes] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .contains("allowed_users", [currentUserId])
            .order("updated_at", { ascending: false }),
          supabase.from("profiles").select("id, display_name"),
          supabase.from("tasks").select("id, project_id, title, status, due_date"),
        ]);

        if (cancelled) return;
        if (projectsRes.error) throw projectsRes.error;
        if (profilesRes.error) throw profilesRes.error;
        if (tasksRes.error) throw tasksRes.error;

        setProjects((projectsRes.data ?? []) as ExtendedProject[]);
        setProfiles((profilesRes.data ?? []) as Profile[]);
        setTasks((tasksRes.data ?? []) as TaskRow[]);
      } catch (err) {
        console.error("Spotlight load failed:", err);
        if (!cancelled) setError("Failed to load projects");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [currentUserId, supabase]);

  // Projects passing the current search filter (includes completed)
  const searchedProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (term.length === 0) return projects;
    return projects.filter((p) => {
      const hay = `${p.name} ${p.description ?? ""}`.toLowerCase();
      return hay.includes(term);
    });
  }, [projects, searchTerm]);

  // Active subset — drives focus + filmstrip
  const visibleProjects = useMemo(
    () => searchedProjects.filter((p) => !p.completed),
    [searchedProjects],
  );

  // Initialise focus from localStorage or first project
  useEffect(() => {
    if (visibleProjects.length === 0) {
      setFocusId(null);
      return;
    }
    setFocusId((current) => {
      if (current && visibleProjects.some((p) => p.id === current)) return current;
      const stored =
        typeof window !== "undefined" ? window.localStorage.getItem(FOCUS_STORAGE_KEY) : null;
      if (stored && visibleProjects.some((p) => p.id === stored)) return stored;
      return visibleProjects[0].id;
    });
  }, [visibleProjects]);

  // Persist focus
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (focusId) window.localStorage.setItem(FOCUS_STORAGE_KEY, focusId);
  }, [focusId]);

  // Hydrate view mode from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (stored === "board" || stored === "focus") setViewMode(stored);
  }, []);

  // Persist view mode
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, viewMode);
  }, [viewMode]);

  const focusProject = useMemo(
    () => visibleProjects.find((p) => p.id === focusId) ?? null,
    [visibleProjects, focusId],
  );

  // Progress per project from tasks (completed / total)
  const progressOf = useCallback(
    (projectId: string) => {
      const projectTasks = tasks.filter((t) => t.project_id === projectId);
      if (projectTasks.length === 0) return 0;
      const done = projectTasks.filter((t) => t.status === "completed").length;
      return Math.round((done / projectTasks.length) * 100);
    },
    [tasks],
  );

  const earliestDueOf = useCallback(
    (projectId: string) => {
      const due = tasks
        .filter((t) => t.project_id === projectId && t.status !== "completed" && t.due_date)
        .map((t) => t.due_date as string)
        .sort();
      return due[0] ?? null;
    },
    [tasks],
  );

  // Load today's focus tasks for the focused project
  useEffect(() => {
    if (!focusProject) {
      setFocusTasks([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        setFocusTasksLoading(true);
        const { data, error: err } = await supabase
          .from("tasks")
          .select("id, title, status, due_date")
          .eq("project_id", focusProject.id)
          .neq("status", "completed")
          .order("due_date", { ascending: true, nullsFirst: false })
          .limit(3);
        if (err) throw err;
        if (cancelled) return;
        setFocusTasks(((data ?? []) as FocusTask[]));
      } catch (err) {
        console.error("Focus tasks load failed:", err);
      } finally {
        if (!cancelled) setFocusTasksLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [focusProject, supabase]);

  const teamForProject = useCallback(
    (project: ExtendedProject | null): string[] => {
      if (!project?.allowed_users) return [];
      return project.allowed_users
        .map((id) => profiles.find((p) => p.id === id)?.display_name ?? null)
        .filter((n): n is string => Boolean(n));
    },
    [profiles],
  );

  const ownerName = useMemo(() => {
    if (!focusProject?.owner_id) return null;
    return profiles.find((p) => p.id === focusProject.owner_id)?.display_name ?? null;
  }, [focusProject, profiles]);

  const stripProjects = useMemo(() => {
    if (!focusId) return visibleProjects;
    return visibleProjects.filter((p) => p.id !== focusId);
  }, [visibleProjects, focusId]);

  // Keyboard navigation
  const cycle = useCallback(
    (direction: 1 | -1) => {
      if (visibleProjects.length < 2) return;
      setFocusId((current) => {
        const idx = Math.max(
          0,
          visibleProjects.findIndex((p) => p.id === current),
        );
        const next =
          (idx + direction + visibleProjects.length) % visibleProjects.length;
        return visibleProjects[next].id;
      });
    },
    [visibleProjects],
  );

  useSpotlightKeyboard({
    onNext: () => cycle(1),
    onPrev: () => cycle(-1),
    onOpen: () => {
      if (focusProject) router.push(`/projects/${focusProject.id}`);
    },
    onNew: () => {
      const wrapper = newProjectWrapperRef.current ?? emptyStateWrapperRef.current;
      wrapper?.querySelector("button")?.click();
    },
    enabled: !loading,
  });

  // Actions
  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [project as ExtendedProject, ...prev]);
    setFocusId(project.id);
  }, []);

  const handleProjectUpdated = useCallback((updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? ({ ...p, ...updated } as ExtendedProject) : p)),
    );
  }, []);

  const toggleProjectCompletion = useCallback(async () => {
    if (!focusProject) return;
    const nextCompleted = !focusProject.completed;
    const prev = projects;
    setProjects((cur) =>
      cur.map((p) => (p.id === focusProject.id ? { ...p, completed: nextCompleted } : p)),
    );
    const { error: err } = await supabase
      .from("projects")
      .update({ completed: nextCompleted })
      .eq("id", focusProject.id);
    if (err) {
      console.error("Toggle completion failed:", err);
      setProjects(prev);
    }
  }, [focusProject, projects, supabase]);

  const deleteFocusProject = useCallback(async () => {
    if (!focusProject) return;
    if (!confirm(`Delete "${focusProject.name}"? This cannot be undone.`)) return;
    const prev = projects;
    setProjects((cur) => cur.filter((p) => p.id !== focusProject.id));
    const { error: err } = await supabase
      .from("projects")
      .delete()
      .eq("id", focusProject.id);
    if (err) {
      console.error("Delete project failed:", err);
      setProjects(prev);
    }
  }, [focusProject, projects, supabase]);

  const toggleFocusTask = useCallback(
    async (taskId: string) => {
      const task = focusTasks.find((t) => t.id === taskId);
      if (!task) return;
      const nextStatus = task.status === "completed" ? "todo" : "completed";
      const prevTasks = focusTasks;
      const prevAll = tasks;
      setFocusTasks((cur) =>
        cur.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)),
      );
      setTasks((cur) => cur.map((t) => (t.id === taskId ? { ...t, status: nextStatus } : t)));
      const { error: err } = await supabase
        .from("tasks")
        .update({ status: nextStatus })
        .eq("id", taskId);
      if (err) {
        console.error("Toggle task failed:", err);
        setFocusTasks(prevTasks);
        setTasks(prevAll);
      }
    },
    [focusTasks, tasks, supabase],
  );

  // Rendering
  if (loading) {
    return (
      <div
        className="flex min-h-screen w-full items-stretch text-white"
        style={{ background: BRAND.navyDeep }}
      >
        <div className="flex flex-1 flex-col gap-6 px-10 py-8 animate-pulse">
          <div className="h-4 w-40 rounded bg-white/10" />
          <div className="h-16 w-2/3 rounded bg-white/10" />
          <div className="h-4 w-1/2 rounded bg-white/10" />
          <div className="mt-auto flex gap-[10px]">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="h-28 flex-1 rounded-xl bg-white/5" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-8 text-white"
        style={{ background: BRAND.navyDeep }}
      >
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-6">
          <p className="font-medium text-rose-100">{error}</p>
        </div>
      </div>
    );
  }

  const focusMeta = focusProject ? deriveProjectMeta(focusProject) : null;
  const focusProgress = focusProject ? progressOf(focusProject.id) : 0;
  const focusDue = focusProject ? earliestDueOf(focusProject.id) : null;
  const focusTeams = teamForProject(focusProject);

  return (
    <div
      className="relative flex min-h-screen w-full min-w-0 overflow-x-hidden flex-col text-white"
      style={{ background: BRAND.navyDeep, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <SpotlightBackground imageUrl={focusMeta?.image ?? null} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] min-w-0 flex-col px-4 pt-[26px] pb-[30px] sm:px-6 lg:px-10">
        {/* Top bar */}
        <div className="mb-[18px] flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4">
          <div className="flex flex-wrap items-center gap-[14px]">
            <div className="text-[12px] font-semibold uppercase tracking-[1.5px] text-white/55">
              {viewMode === "focus" ? "Focus mode" : "Board view"}
            </div>
            <div className="flex gap-1 rounded-full bg-white/5 p-1 text-[12.5px]">
              <button
                type="button"
                onClick={() => setViewMode("focus")}
                className={`rounded-full px-3 py-[5px] transition-colors ${
                  viewMode === "focus"
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Focus
              </button>
              <button
                type="button"
                onClick={() => setViewMode("board")}
                className={`rounded-full px-3 py-[5px] transition-colors ${
                  viewMode === "board"
                    ? "bg-white/10 text-white"
                    : "text-white/55 hover:text-white"
                }`}
              >
                Board
              </button>
            </div>
          </div>
          <div className="flex w-full flex-col gap-[10px] sm:flex-row sm:items-center md:w-auto">
            <div className="relative w-full sm:w-auto">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search projects"
                className="h-9 w-full rounded-lg border border-white/15 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-white/40 focus:border-[#81bb26]/50 focus:outline-none sm:w-[220px]"
              />
            </div>
            <div
              ref={newProjectWrapperRef}
              className="[&_button]:!rounded-[10px] [&_button]:!bg-[#81bb26] [&_button]:!px-[18px] [&_button]:!py-[10px] [&_button]:!text-sm [&_button]:!font-bold [&_button]:!text-[#1c3145] [&_button]:!shadow-[0_4px_14px_rgba(129,187,38,0.35)] [&_button]:hover:!bg-[#74a822] [&_button]:hover:-translate-y-0.5 [&_button]:transition-transform"
            >
              <NewProjectDialog onProjectCreated={handleProjectCreated} />
            </div>
          </div>
        </div>

        {/* Content */}
        {viewMode === "board" && searchedProjects.length > 0 ? (
          <BoardView
            projects={searchedProjects}
            progressOf={progressOf}
            dueOf={earliestDueOf}
            onSelect={(id) => {
              const target = searchedProjects.find((p) => p.id === id);
              if (!target) return;
              if (target.completed) {
                router.push(`/projects/${id}`);
                return;
              }
              setFocusId(id);
              setViewMode("focus");
            }}
          />
        ) : focusProject ? (
          <>
            <div className="flex flex-1 min-w-0 flex-col justify-center gap-6 xl:flex-row xl:items-center xl:gap-10">
              <FocusHero
                project={focusProject}
                progress={focusProgress}
                teamsCount={focusTeams.length}
                dueDate={focusDue}
                onToggleComplete={toggleProjectCompletion}
                onDelete={deleteFocusProject}
                onProjectUpdated={handleProjectUpdated}
              />
              <div className="flex w-full min-w-0 flex-col gap-[18px] xl:w-[340px] xl:shrink-0">
                {focusMeta && (
                  <ProgressRingCard
                    progress={focusProgress}
                    color={focusMeta.color}
                    team={focusTeams}
                    owner={ownerName}
                    updatedAt={focusProject.updated_at}
                  />
                )}
                <TodayFocusList
                  tasks={focusTasks}
                  loading={focusTasksLoading}
                  onToggle={toggleFocusTask}
                />
              </div>
            </div>

            <Filmstrip
              projects={stripProjects}
              progressOf={progressOf}
              dueOf={earliestDueOf}
              onSelect={(id) => setFocusId(id)}
            />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <div
              className="flex max-w-xl flex-col items-center rounded-2xl border border-white/10 p-10 text-center backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <h2 className="text-3xl font-extrabold text-white">No active projects yet</h2>
              <p className="mt-3 text-white/70">
                Start by creating your first project — the spotlight will light up once it&apos;s here.
              </p>
              <div
                ref={emptyStateWrapperRef}
                className="mt-6 [&_button]:!rounded-xl [&_button]:!bg-[#81bb26] [&_button]:!px-6 [&_button]:!py-3 [&_button]:!text-base [&_button]:!font-bold [&_button]:!text-[#1c3145] [&_button]:!shadow-[0_10px_28px_rgba(129,187,38,0.4)] [&_button]:hover:!bg-[#74a822] [&_button]:hover:-translate-y-0.5 [&_button]:transition-transform"
              >
                <NewProjectDialog onProjectCreated={handleProjectCreated} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
