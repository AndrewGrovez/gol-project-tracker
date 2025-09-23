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
  const supabase = createClient();
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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="p-6 max-w-6xl mx-auto">
        {/* Greeting section: if it's evening, display Good Ebening image; otherwise, show text */}
        <div className="mb-8 text-4xl font-extrabold text-center transition-transform duration-300 ease-in-out hover:scale-105">
          {isEvening ? (
            <Image
              src="/motivational/good ebening.jpg"
              alt="Good Ebening"
              width={300}
              height={100}
              className="mx-auto"
            />
          ) : (
            <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-transparent bg-clip-text">
              {ukHour < 12 ? "Bore Da" : "Prynhawn Da"}, {displayName}
            </span>
          )}
        </div>

        {/* Conditionally display white goodman image only if it's not evening */}
        {!isEvening && displayName && ["Andrew", "Jake", "Steve", "Aaron"].includes(displayName) && (
          <div className="my-6 flex justify-center">
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Projects</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full sm:w-64"
            />
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as ProjectStatusFilter)}
              className="w-full sm:w-44"
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

        <hr className="mb-6 border-gray-200" />

        {/* Active Projects Section */}
        {showActiveSection && (
          <section className="mb-6">
            <div
              className="flex items-center justify-between mb-6 cursor-pointer bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => setActiveOpen(!activeOpen)}
            >
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Active Projects
                <span className="px-3 py-1 bg-[#1c3145]/10 text-[#1c3145] rounded-full text-sm font-medium">
                  {activeProjects.length}
                </span>
              </h2>
              {activeOpen ? (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronRight className="w-6 h-6 text-gray-500" />
              )}
            </div>
            {activeOpen && (
              <>
                {activeProjects.length === 0 ? (
                  <p className="text-gray-500">No active projects match your filters.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {activeProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-[#1c3145]">
                        <CardContent className="p-6 flex flex-col h-full">
                          {/* Project details */}
                          <div
                            className="cursor-pointer group"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <h4 className="text-2xl font-semibold text-gray-900 group-hover:text-[#1c3145] transition-colors duration-300">
                              {project.name}
                            </h4>
                            <p className="text-gray-700 mt-1">{project.description}</p>
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
                              className="text-red-600 hover:bg-red-100 transition-colors duration-300 p-2"
                              aria-label="Delete project"
                              title="Delete project"
                              onClick={() => deleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:bg-green-100 transition-colors duration-300 p-2"
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

        <hr className="mb-8 border-gray-200" />

        {/* Completed Projects Section */}
        {showCompletedSection && (
          <section>
            <div
              className="flex items-center justify-between mb-6 cursor-pointer bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-all duration-300"
              onClick={() => setCompletedOpen(!completedOpen)}
            >
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Completed Projects
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {completedProjects.length}
                </span>
              </h2>
              {completedOpen ? (
                <ChevronDown className="w-6 h-6 text-gray-500" />
              ) : (
                <ChevronRight className="w-6 h-6 text-gray-500" />
              )}
            </div>
            {completedOpen && (
              <>
                {completedProjects.length === 0 ? (
                  <p className="text-gray-500">No completed projects match your filters.</p>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {completedProjects.map((project) => (
                      <Card key={project.id} className="hover:shadow-lg transition-all duration-300 border-l-4 border-green-500 bg-gray-50">
                        <CardContent className="p-6 flex flex-col h-full">
                          <div
                            className="cursor-pointer group"
                            onClick={() => router.push(`/projects/${project.id}`)}
                          >
                            <h4 className="text-2xl font-semibold text-gray-700 group-hover:text-green-600 transition-colors duration-300">
                              {project.name}
                            </h4>
                            <p className="text-gray-600 mt-1">{project.description}</p>
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
                              className="text-red-600 hover:bg-red-100 transition-colors duration-300 p-2"
                              aria-label="Delete project"
                              title="Delete project"
                              onClick={() => deleteProject(project.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-green-600 hover:bg-green-100 transition-colors duration-300 p-2"
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
          <p className="mt-6 text-center text-gray-500">No projects match your search or filters.</p>
        )}
      </div>
    </div>
  );
}
