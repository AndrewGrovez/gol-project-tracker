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
} from "lucide-react";
import NewTaskDialog from "./NewTaskDialog";
import EditTaskDialog from "./EditTaskDialog";
import NewKPIDialog from "./NewKPIDialog";
import ProjectTimeline from "./ProjectTimeline";
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

  if (error || !project) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Project not found"}
        </div>
      </div>
    );
  }

  // Split tasks into "To do" and "Completed"
  const todoTasks = sortedTasks.filter((task) => task.status !== "completed");
  const completedTasks = sortedTasks.filter((task) => task.status === "completed");

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

        {/* View Toggle */}
        <section className="mb-6">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-[#1c3145] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <List className="w-4 h-4" />
                List
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-[#1c3145] text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Columns className="w-4 h-4" />
                Kanban
              </button>
            </div>
          </div>
        </section>

        {/* Tasks Section */}
        {viewMode === 'kanban' ? (
          <section className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Tasks</h2>
              <NewTaskDialog
                projectId={project.id}
                onTaskCreated={(newTask: Task) => setTasks((prevTasks) => [newTask, ...prevTasks])}
              />
            </div>
            <KanbanBoard 
              initialData={[
                {
                  id: 'todo',
                  title: 'To Do',
                  tasks: tasks.filter(task => task.status === 'todo').map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description || undefined,
                    assignee: profiles.find(p => p.id === task.assigned_to)?.display_name,
                    dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                  }))
                },
                {
                  id: 'inprogress',
                  title: 'In Progress',
                  tasks: tasks.filter(task => task.status === 'in_progress').map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description || undefined,
                    assignee: profiles.find(p => p.id === task.assigned_to)?.display_name,
                    dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                  }))
                },
                {
                  id: 'completed',
                  title: 'Completed',
                  tasks: tasks.filter(task => task.status === 'completed').map(task => ({
                    id: task.id,
                    title: task.title,
                    description: task.description || undefined,
                    assignee: profiles.find(p => p.id === task.assigned_to)?.display_name,
                    dueDate: task.due_date ? formatDateDisplay(task.due_date) : undefined,
                  }))
                }
              ]}
              tasks={tasks}
              onTaskMove={(taskId: string, fromColumn: string, toColumn: string) => {
                const statusMap: Record<string, Task['status']> = {
                  'todo': 'todo',
                  'inprogress': 'in_progress',
                  'completed': 'completed'
                };
                updateTaskStatus(taskId, statusMap[toColumn]);
              }}
              onTaskUpdate={(updatedTask: Task) => {
                setTasks((currentTasks) =>
                  currentTasks.map((t) =>
                    t.id === updatedTask.id ? updatedTask : t
                  )
                );
              }}
            />
          </section>
        ) : (
          <>
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
            <div onClick={(e) => e.stopPropagation()}>
              <NewTaskDialog
                projectId={project.id}
                onTaskCreated={(newTask: Task) => setTasks((prevTasks) => [newTask, ...prevTasks])}
              />
            </div>
          </div>
          {todoOpen &&
            (todoTasks.length === 0 ? (
              <p className="text-gray-500">No tasks yet</p>
            ) : (
              <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
                <table className="w-full">
                  <thead className="bg-[#1c3145] text-white">
                    <tr>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("title")}
                      >
                        Task{renderSortArrowForTasks("title")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("status")}
                      >
                        Status{renderSortArrowForTasks("status")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("assigned_to")}
                      >
                        Assignee{renderSortArrowForTasks("assigned_to")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("due_date")}
                      >
                        Due{renderSortArrowForTasks("due_date")}
                      </th>
                      <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                    {todoTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-[#81bb26]/10">
                        <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                          {task.title}
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
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <Select
                            value={task.assigned_to || ""}
                            className="min-w-[100px] text-xs"
                            onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
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
                          <div className="flex justify-end items-center gap-2">
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
              <p className="text-gray-500">No completed tasks yet</p>
            ) : (
              <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
                <table className="w-full">
                  <thead className="bg-[#1c3145] text-white">
                    <tr>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("title")}
                      >
                        Task{renderSortArrowForTasks("title")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("status")}
                      >
                        Status{renderSortArrowForTasks("status")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("assigned_to")}
                      >
                        Assignee{renderSortArrowForTasks("assigned_to")}
                      </th>
                      <th
                        className="px-6 py-2 text-left text-sm font-medium cursor-pointer"
                        onClick={() => handleTaskSort("due_date")}
                      >
                        Due{renderSortArrowForTasks("due_date")}
                      </th>
                      <th className="px-6 py-2 text-right text-sm font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                    {completedTasks.map((task) => (
                      <tr key={task.id} className="hover:bg-[#81bb26]/10">
                        <td className="px-6 py-3 text-sm text-gray-900 whitespace-normal break-words">
                          {task.title}
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
                        <td className="px-6 py-3 whitespace-nowrap text-sm">
                          <Select
                            value={task.assigned_to || ""}
                            className="min-w-[100px] text-xs"
                            onChange={(e) => updateTaskAssignee(task.id, e.target.value)}
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
                          <div className="flex justify-end items-center gap-2">
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

        <hr className="mb-8 border-gray-300" />

        {/* KPIs section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">KPIs</h2>
            <NewKPIDialog
              projectId={project.id}
              onKPICreated={(newKpi: KPI) => setKpis((prevKpis) => [newKpi, ...prevKpis])}
            />
          </div>
          {sortedKpis.length === 0 ? (
            <p className="text-gray-500">No KPIs yet</p>
          ) : (
            <div className="border border-[#1c3145]/40 rounded-lg overflow-hidden shadow">
              <table className="w-full">
                <thead className="bg-[#1c3145] text-white">
                  <tr>
                    <th
                      className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleKpiSort("title")}
                    >
                      KPI{renderSortArrowForKpis("title")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-sm font-medium cursor-pointer"
                      onClick={() => handleKpiSort("measure_date")}
                    >
                      Measure Date{renderSortArrowForKpis("measure_date")}
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-medium">Result</th>
                    <th className="px-6 py-3 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c3145]/40 bg-white">
                  {sortedKpis.map((kpi) => (
                    <tr key={kpi.id} className="hover:bg-[#81bb26]/10">
                      <td className="px-6 py-4 text-sm text-gray-900">{kpi.title}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {formatDateDisplay(kpi.measure_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{kpi.result}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <EditKPIDialog
                            kpi={kpi}
                            onKPIUpdated={(updatedKpi: KPI) => {
                              setKpis((currentKpis) =>
                                currentKpis.map((k) => (k.id === updatedKpi.id ? updatedKpi : k))
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

      {/* Project Timeline Section */}
        <section className="mb-8">
          <ProjectTimeline projectId={project.id} />
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