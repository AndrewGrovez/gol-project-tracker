"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import type { Project } from "@/types/database.types";
import { createClient } from "@/utils/supabase/client";
import NewProjectDialog from "@/components/NewProjectDialog";

import SpotlightBackground from "./SpotlightBackground";
import BoardView from "./BoardView";
import { BRAND } from "./spotlight-config";

type ExtendedProject = Project & { allowed_users?: string[] | null };

type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  status: string;
  due_date: string | null;
};

export default function ProjectSpotlight() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [projects, setProjects] = useState<ExtendedProject[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");

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

  // Load projects + tasks once we have a user
  useEffect(() => {
    if (!currentUserId) return;
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [projectsRes, tasksRes] = await Promise.all([
          supabase
            .from("projects")
            .select("*")
            .contains("allowed_users", [currentUserId])
            .order("updated_at", { ascending: false }),
          supabase.from("tasks").select("id, project_id, title, status, due_date"),
        ]);

        if (cancelled) return;
        if (projectsRes.error) throw projectsRes.error;
        if (tasksRes.error) throw tasksRes.error;

        setProjects((projectsRes.data ?? []) as ExtendedProject[]);
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

  // Actions
  const handleProjectCreated = useCallback((project: Project) => {
    setProjects((prev) => [project as ExtendedProject, ...prev]);
  }, []);

  const handleProjectUpdated = useCallback((updated: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? ({ ...p, ...updated } as ExtendedProject) : p)),
    );
  }, []);

  const toggleProjectCompletion = useCallback(
    async (project: Project) => {
      const nextCompleted = !project.completed;
      const prev = projects;
      setProjects((cur) =>
        cur.map((p) => (p.id === project.id ? { ...p, completed: nextCompleted } : p)),
      );
      const { error: err } = await supabase
        .from("projects")
        .update({ completed: nextCompleted })
        .eq("id", project.id);
      if (err) {
        console.error("Toggle completion failed:", err);
        setProjects(prev);
      }
    },
    [projects, supabase],
  );

  const deleteProject = useCallback(
    async (project: Project) => {
      if (!confirm(`Delete "${project.name}"? This cannot be undone.`)) return;
      const prev = projects;
      setProjects((cur) => cur.filter((p) => p.id !== project.id));
      const { error: err } = await supabase.from("projects").delete().eq("id", project.id);
      if (err) {
        console.error("Delete project failed:", err);
        setProjects(prev);
      }
    },
    [projects, supabase],
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

  return (
    <div
      className="relative flex min-h-screen w-full min-w-0 overflow-x-hidden flex-col text-white"
      style={{ background: BRAND.navyDeep, fontFamily: "Inter, system-ui, sans-serif" }}
    >
      <SpotlightBackground imageUrl={null} />

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1400px] min-w-0 flex-col px-4 pt-[26px] pb-[30px] sm:px-6 lg:px-10">
        {/* Top bar */}
        <div className="mb-[18px] flex flex-col gap-3 md:flex-row md:items-center md:justify-end md:gap-4">
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
            <div className="[&_button]:!rounded-[10px] [&_button]:!bg-[#81bb26] [&_button]:!px-[18px] [&_button]:!py-[10px] [&_button]:!text-sm [&_button]:!font-bold [&_button]:!text-[#1c3145] [&_button]:!shadow-[0_4px_14px_rgba(129,187,38,0.35)] [&_button]:hover:!bg-[#74a822] [&_button]:hover:-translate-y-0.5 [&_button]:transition-transform">
              <NewProjectDialog onProjectCreated={handleProjectCreated} />
            </div>
          </div>
        </div>

        {/* Content */}
        {projects.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div
              className="flex max-w-xl flex-col items-center rounded-2xl border border-white/10 p-10 text-center backdrop-blur-xl"
              style={{ background: "rgba(255,255,255,0.05)" }}
            >
              <h2 className="text-3xl font-extrabold text-white">No projects yet</h2>
              <p className="mt-3 text-white/70">
                Start by creating your first project — it&apos;ll show up on the board.
              </p>
              <div className="mt-6 [&_button]:!rounded-xl [&_button]:!bg-[#81bb26] [&_button]:!px-6 [&_button]:!py-3 [&_button]:!text-base [&_button]:!font-bold [&_button]:!text-[#1c3145] [&_button]:!shadow-[0_10px_28px_rgba(129,187,38,0.4)] [&_button]:hover:!bg-[#74a822] [&_button]:hover:-translate-y-0.5 [&_button]:transition-transform">
                <NewProjectDialog onProjectCreated={handleProjectCreated} />
              </div>
            </div>
          </div>
        ) : (
          <BoardView
            projects={searchedProjects}
            progressOf={progressOf}
            dueOf={earliestDueOf}
            onSelect={(id) => router.push(`/projects/${id}`)}
            onToggleComplete={toggleProjectCompletion}
            onDelete={deleteProject}
            onProjectUpdated={handleProjectUpdated}
          />
        )}
      </div>
    </div>
  );
}
