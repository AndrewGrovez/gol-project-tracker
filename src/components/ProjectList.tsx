"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import type { Project } from "@/types/database.types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import NewProjectDialog from "@/components/NewProjectDialog";
import EditProjectDialog from "@/components/EditProjectDialog";
import { createClient } from "@/utils/supabase/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type ProjectStatusFilter = "all" | "active" | "completed";

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [activeOpen, setActiveOpen] = useState(true);
  const [completedOpen, setCompletedOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatusFilter>("all");
  const supabase = useMemo(() => createClient(), []);
  const [displayName, setDisplayName] = useState<string>("");
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // Get the current UK hour using Intl
  const getUKHour = (): number => {
    return Number(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "numeric",
        hour12: false,
      }).format(new Date())
    );
  };

  const ukHour = getUKHour();
  const isEvening = ukHour >= 17;

  // Fetch current user's details
  useEffect(() => {
    const getUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setCurrentUserId(session.user.id);
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single();
      if (profileError) console.error("Error fetching profile:", profileError);
      else setDisplayName(profileData?.display_name || "");
    };
    getUser();
  }, [supabase]);

  useEffect(() => {
    async function checkSession() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) router.push("/login");
    }
    checkSession();
  }, [router, supabase]);

  // Fetch projects where allowed_users contains the current user ID
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .contains("allowed_users", [currentUserId])
          .order("created_at", { ascending: false });
        if (error) throw error;
        setProjects(data || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load projects");
      } finally {
        setLoading(false);
      }
    };
    if (currentUserId) {
      fetchProjects();
    }
  }, [supabase, currentUserId]);

  const toggleProjectCompletion = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ completed: !currentStatus })
        .eq("id", projectId);
      if (error) throw error;
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId ? { ...project, completed: !currentStatus } : project
        )
      );
    } catch (error) {
      console.error("Error toggling project completion:", error);
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);
      if (error) throw error;
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId)
      );
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  const filteredProjects = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return projects.filter((project) => {
      const matchesSearch = term.length === 0
        ? true
        : [project.name, project.description ?? ""].some((value) =>
            value.toLowerCase().includes(term)
          );

      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "active"
            ? !project.completed
            : project.completed;

      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const activeProjects = filteredProjects.filter((project) => !project.completed);
  const completedProjects = filteredProjects.filter((project) => project.completed);
  const showActiveSection = statusFilter !== "completed";
  const showCompletedSection = statusFilter !== "active";

  if (loading) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-12 w-64 bg-gray-100 rounded-lg mb-8"></div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-gray-50 rounded-xl shadow-sm"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg">
          <p className="text-red-700 font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute -left-40 top-0 h-[60rem] w-[60rem] rotate-12 rounded-full bg-[radial-gradient(circle_at_center,_rgba(129,187,38,0.35)_0%,_rgba(12,74,110,0.05)_70%,_transparent_100%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-20rem] top-40 h-[50rem] w-[50rem] rounded-full bg-[radial-gradient(circle_at_center,_rgba(12,74,110,0.35)_0%,_rgba(124,58,237,0.08)_60%,_transparent_100%)] blur-3xl" />

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10">
        {/* Greeting section: if it's evening, display Good Ebening image; otherwise, show text */}
        <div className="text-center text-4xl font-extrabold text-white transition-transform duration-300 ease-in-out hover:scale-105">
          {isEvening ? (
            <Image
              src="/motivational/good ebening.jpg"
              alt="Good Ebening"
              width={300}
              height={100}
              className="mx-auto"
            />
          ) : (
            <span className="bg-gradient-to-r from-lime-300 via-emerald-300 to-cyan-200 bg-clip-text text-transparent">
              {ukHour < 12 ? "Bore Da" : "Prynhawn Da"}, {displayName}
            </span>
          )}
        </div>

        {/* Conditionally display white goodman image only if it's not evening */}
        {!isEvening && displayName && ["Andrew", "Jake", "Steve", "Aaron"].includes(displayName) && (
          <div className="flex justify-center">
            <Image
              src="/motivational/white goodman.jpg"
              alt="Motivational Dodgeball"
              width={140}
              height={71}
              className="rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300"
            />
          </div>
        )}

        {/* Header with NewProjectDialog */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full border-white/30 bg-white/10 text-white placeholder:text-white/60 backdrop-blur-lg sm:w-64"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
              className="w-full border-white/30 bg-white/10 text-white backdrop-blur-lg sm:w-44"
              aria-label="Filter projects by status"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </Select>
            <NewProjectDialog
              onProjectCreated={(newProject: Project) =>
                setProjects((prevProjects) => [newProject, ...prevProjects])
              }
            />
          </div>
        </div>

        {/* Active Projects Section */}
        {showActiveSection && (
          <section className="space-y-6">
            <div
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:bg-white/15"
              onClick={() => setActiveOpen(!activeOpen)}
            >
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                Active Projects
                <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white/90">
                  {activeProjects.length}
                </span>
              </h2>
              {activeOpen ? (
                <ChevronDown className="h-6 w-6 text-white/70" />
              ) : (
                <ChevronRight className="h-6 w-6 text-white/70" />
              )}
            </div>
            {activeOpen && (
              <>
                {activeProjects.length === 0 ? (
                  <p className="text-white/70">No active projects match your filters.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {activeProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="border border-white/15 bg-white/10 text-white shadow-2xl shadow-slate-900/40 backdrop-blur-2xl transition-all duration-300 hover:bg-white/15"
                      >
                        <CardContent className="flex h-full flex-col p-6">
                          {/* Project details */}
                          <div
                            className="cursor-pointer group"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <h4 className="text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-lime-200">
                              {project.name}
                            </h4>
                            <p className="mt-1 text-sm text-white/70">{project.description}</p>
                          </div>
                          <div className="mt-auto" />
                          {/* Button group */}
                          <div className="flex justify-end gap-3">
                            <EditProjectDialog
                              project={project}
                              onProjectUpdated={(updatedProject: Project) =>
                                setProjects((currentProjects) =>
                                  currentProjects.map((p) =>
                                    p.id === updatedProject.id ? updatedProject : p
                                  )
                                )
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/10 p-2 text-rose-200 hover:bg-white/20"
                              aria-label="Delete project"
                              title="Delete project"
                              onClick={() => deleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/10 p-2 text-emerald-200 hover:bg-white/20"
                              aria-label="Toggle project completion"
                              title="Toggle project completion"
                              onClick={() => toggleProjectCompletion(project.id, project.completed)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Completed Projects Section */}
        {showCompletedSection && (
          <section className="space-y-6">
            <div
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 p-5 shadow-lg shadow-slate-950/40 backdrop-blur-xl transition-all duration-300 hover:bg-white/15"
              onClick={() => setCompletedOpen(!completedOpen)}
            >
              <h2 className="flex items-center gap-3 text-2xl font-bold text-white">
                Completed Projects
                <span className="rounded-full bg-emerald-400/30 px-3 py-1 text-sm font-medium text-emerald-100">
                  {completedProjects.length}
                </span>
              </h2>
              {completedOpen ? (
                <ChevronDown className="h-6 w-6 text-white/70" />
              ) : (
                <ChevronRight className="h-6 w-6 text-white/70" />
              )}
            </div>
            {completedOpen && (
              <>
                {completedProjects.length === 0 ? (
                  <p className="text-white/70">No completed projects match your filters.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {completedProjects.map((project) => (
                      <Card
                        key={project.id}
                        className="border border-emerald-300/20 bg-emerald-200/15 text-white shadow-2xl shadow-emerald-900/30 backdrop-blur-2xl transition-all duration-300 hover:bg-emerald-200/25"
                      >
                        <CardContent className="flex h-full flex-col p-6">
                          <div
                            className="cursor-pointer group"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <h4 className="text-2xl font-semibold text-white transition-colors duration-300 group-hover:text-emerald-100">
                              {project.name}
                            </h4>
                            <p className="mt-1 text-sm text-white/70">{project.description}</p>
                          </div>
                          <div className="mt-auto" />
                          <div className="flex justify-end gap-3">
                            <EditProjectDialog
                              project={project}
                              onProjectUpdated={(updatedProject: Project) =>
                                setProjects((currentProjects) =>
                                  currentProjects.map((p) =>
                                    p.id === updatedProject.id ? updatedProject : p
                                  )
                                )
                              }
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/10 p-2 text-rose-200 hover:bg-white/20"
                              aria-label="Delete project"
                              title="Delete project"
                              onClick={() => deleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 bg-white/10 p-2 text-emerald-200 hover:bg-white/20"
                              aria-label="Toggle project completion"
                              title="Toggle project completion"
                              onClick={() => toggleProjectCompletion(project.id, project.completed)}
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {filteredProjects.length === 0 && (
          <p className="text-center text-sm text-white/70">No projects match your search or filters.</p>
        )}
      </div>
    </div>
  );
}
