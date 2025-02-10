"use client";

import React, { useEffect, useState } from "react";
import type { Project, Task, KPI } from "@/types/database.types";
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import NewTaskDialog from "./NewTaskDialog";
import EditTaskDialog from "./EditTaskDialog";
import NewKPIDialog from "./NewKPIDialog";
import { Select } from "./ui/select";
import { Button } from "./ui/button";
import EditKPIDialog from "./EditKPIDialog";
import { createClient } from "@/utils/supabase/client";
import ProjectComments from "./ProjectComments";

interface ProjectDetailsProps {
  id: string;
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
  const [completedOpen, setCompletedOpen] = useState(true);

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

        // Fetch project tasks
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false });
        if (taskError) throw taskError;

        // Fetch project KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from("kpis")
          .select("*")
          .eq("project_id", id)
          .order("measure_date", { ascending: false });
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
      setTasks(currentTasks =>
        currentTasks.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
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
      setTasks(currentTasks =>
        currentTasks.map(task => (task.id === taskId ? { ...task, assigned_to: newAssignee } : task))
      );
    } catch (error) {
      console.error("Error updating task assignee:", error);
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

  const deleteKPI = async (kpiId: string) => {
    if (!confirm("Are you sure you want to delete this KPI measurement?")) return;
    try {
      const { error } = await supabase.from("kpis").delete().eq("id", kpiId);
      if (error) throw error;
      setKpis(currentKpis => currentKpis.filter(kpi => kpi.id !== kpiId));
    } catch (error) {
      console.error("Error deleting KPI:", error);
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

  if (error || !project) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Project not found"}
        </div>
      </div>
    );
  }

  // Split tasks into "To do" (not completed) and "Completed tasks"
  const todoTasks = tasks.filter(task => task.status !== "completed");
  const completedTasks = tasks.filter(task => task.status === "completed");

  return (
    <div>
      <div className="p-6 max-w-5xl mx-auto">
        {/* Project Header */}
        <section className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(project.status)}
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <p className="text-gray-600">{project.description}</p>
        </section>

        <hr className="mb-8 border-gray-300" />

        {/* To do tasks section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => setTodoOpen(!todoOpen)}
            >
              <h2 className="text-xl font-semibold">To do ({todoTasks.length})</h2>
              {todoOpen ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </div>
            {/* New Task Button – stops propagation so that clicking it doesn’t toggle */}
            <div onClick={(e) => e.stopPropagation()}>
              <NewTaskDialog
                projectId={project.id}
                onTaskCreated={(newTask: Task) =>
                  setTasks(prevTasks => [newTask, ...prevTasks])
                }
              />
            </div>
          </div>
          {todoOpen && (
            todoTasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet</p>
            ) : (
              <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
                <table className="w-full">
                  <thead className="bg-[#1c3145] text-white">
                    <tr>
                      <th className="px-6 py-2 text-left text-sm font-medium">Task</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Assignee</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Due</th>
                      <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                    {todoTasks.map(task => (
                      <tr key={task.id} className="hover:bg-[#81bb26]/10">
                        {/* Allow text wrapping */}
                        <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                          {task.title}
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
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <Select
                            value={task.assigned_to || ""}
                            className="min-w-[100px] text-xs"
                            onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {profiles.map(profile => (
                              <option key={profile.id} value={profile.id}>
                                {profile.display_name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "-"}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <EditTaskDialog
                              task={task}
                              onTaskUpdated={(updatedTask: Task) =>
                                setTasks(currentTasks =>
                                  currentTasks.map(t =>
                                    t.id === updatedTask.id ? updatedTask : t
                                  )
                                )
                              }
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
            )
          )}
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
          {completedOpen && (
            completedTasks.length === 0 ? (
              <p className="text-gray-500">No completed tasks yet</p>
            ) : (
              <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
                <table className="w-full">
                  <thead className="bg-[#1c3145] text-white">
                    <tr>
                      <th className="px-6 py-2 text-left text-sm font-medium">Task</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Status</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Assignee</th>
                      <th className="px-6 py-2 text-left text-sm font-medium">Due</th>
                      <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                    {completedTasks.map(task => (
                      <tr key={task.id} className="hover:bg-[#81bb26]/10">
                        {/* Allow text wrapping */}
                        <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                          {task.title}
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
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <Select
                            value={task.assigned_to || ""}
                            className="min-w-[100px] text-xs"
                            onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
                          >
                            <option value="">Unassigned</option>
                            {profiles.map(profile => (
                              <option key={profile.id} value={profile.id}>
                                {profile.display_name}
                              </option>
                            ))}
                          </Select>
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-900">
                          {task.due_date ? new Date(task.due_date).toLocaleDateString("en-GB") : "-"}
                        </td>
                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end items-center gap-2">
                            <EditTaskDialog
                              task={task}
                              onTaskUpdated={(updatedTask: Task) =>
                                setTasks(currentTasks =>
                                  currentTasks.map(t =>
                                    t.id === updatedTask.id ? updatedTask : t
                                  )
                                )
                              }
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
            )
          )}
        </section>

        <hr className="mb-8 border-gray-300" />

        {/* KPIs section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">KPIs</h2>
            <NewKPIDialog
              projectId={project.id}
              onKPICreated={(newKpi: KPI) =>
                setKpis(prevKpis => [newKpi, ...prevKpis])
              }
            />
          </div>
          {kpis.length === 0 ? (
            <p className="text-gray-500">No KPIs yet</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium">KPI</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Measure Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Result</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {kpis.map(kpi => (
                    <tr key={kpi.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-4 text-sm text-gray-900">{kpi.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(kpi.measure_date).toLocaleDateString("en-GB")}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{kpi.result}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <EditKPIDialog
                            kpi={kpi}
                            onKPIUpdated={(updatedKpi: KPI) => {
                              setKpis(currentKpis =>
                                currentKpis.map(k =>
                                  k.id === updatedKpi.id ? updatedKpi : k
                                )
                              );
                            }}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
        </section>

        <hr className="mb-8 border-gray-300" />

        {/* Comments section */}
        <section className="mb-8">
          <ProjectComments projectId={project.id} />
        </section>
      </div>
    </div>
  );
}