"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import type { Project, Task, KPI } from "@/types/database.types"
import { Card, CardContent } from "./ui/card"
import {
  Activity,
  CheckCircle,
  Clock,
  AlertTriangle,
  Trash2,
  Home,
  ChevronDown,
  ChevronRight,
} from "lucide-react"
import NewTaskDialog from "./NewTaskDialog"
import EditTaskDialog from "./EditTaskDialog"
import NewKPIDialog from "./NewKPIDialog"
import { Select } from "./ui/select"
import { Button } from "./ui/button"
import EditKPIDialog from "./EditKPIDialog"
import { createClient } from "@/utils/supabase/client"
import ProjectComments from './ProjectComments'

interface ProjectDetailsProps {
  id: string
}

export default function ProjectDetails({ id }: ProjectDetailsProps) {
  const router = useRouter()
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [kpis, setKpis] = useState<KPI[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Profiles fetched from the profiles table for assignment options
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])

  // Collapsible states for tasks sections
  const [todoOpen, setTodoOpen] = useState(true)
  const [completedOpen, setCompletedOpen] = useState(true)

  const supabase = createClient();

  // Fetch project details, tasks, and KPIs
  useEffect(() => {
    async function fetchProjectData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch project details
        const { data: projectData, error: projectError } = await supabase
          .from("projects")
          .select("*")
          .eq("id", id)
          .single()
        if (projectError) throw projectError

        // Fetch project tasks
        const { data: taskData, error: taskError } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", id)
          .order("created_at", { ascending: false })
        if (taskError) throw taskError

        // Fetch project KPIs
        const { data: kpiData, error: kpiError } = await supabase
          .from("kpis")
          .select("*")
          .eq("project_id", id)
          .order("measure_date", { ascending: false })
        if (kpiError) throw kpiError

        setProject(projectData)
        setTasks(taskData || [])
        setKpis(kpiData || [])
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load project details")
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [id, supabase])

  // Fetch profiles for assignment options
  useEffect(() => {
    async function fetchProfiles() {
      try {
        const { data, error } = await supabase.from("profiles").select("id, display_name")
        if (error) throw error
        setProfiles(data || [])
      } catch (err) {
        console.error("Error fetching profiles:", err)
      }
    }
    fetchProfiles()
  }, [supabase])

  const updateTaskStatus = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ status: newStatus })
        .eq("id", taskId)
      if (error) throw error
      setTasks(currentTasks =>
        currentTasks.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
      )
    } catch (error) {
      console.error("Error updating task status:", error)
    }
  }

  // Update the task assignment
  const updateTaskAssignee = async (taskId: string, newAssignee: string) => {
    try {
      const { error } = await supabase
        .from("tasks")
        .update({ assigned_to: newAssignee || null })
        .eq("id", taskId)
      if (error) throw error
      setTasks(currentTasks =>
        currentTasks.map(task => (task.id === taskId ? { ...task, assigned_to: newAssignee } : task))
      )
    } catch (error) {
      console.error("Error updating task assignee:", error)
    }
  }

  const getStatusIcon = (status: Project["status"]) => {
    const iconClass = "w-5 h-5"
    switch (status) {
      case "completed":
        return <CheckCircle className={`${iconClass} text-green-500`} />
      case "in_progress":
        return <Activity className={`${iconClass} text-blue-500`} />
      case "not_started":
        return <Clock className={`${iconClass} text-gray-500`} />
      case "delayed":
        return <AlertTriangle className={`${iconClass} text-red-500`} />
      default:
        return <Clock className={`${iconClass} text-gray-500`} />
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", taskId)
      if (error) throw error
      setTasks(currentTasks => currentTasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error("Error deleting task:", error)
    }
  }

  const deleteKPI = async (kpiId: string) => {
    if (!confirm("Are you sure you want to delete this KPI measurement?")) return
    try {
      const { error } = await supabase.from("kpis").delete().eq("id", kpiId)
      if (error) throw error
      setKpis(currentKpis => currentKpis.filter(kpi => kpi.id !== kpiId))
    } catch (error) {
      console.error("Error deleting KPI:", error)
    }
  }

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
    )
  }

  if (error || !project) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || "Project not found"}
        </div>
      </div>
    )
  }

  // Split tasks into "To do" (not completed) and "Completed tasks"
  const todoTasks = tasks.filter(task => task.status !== "completed")
  const completedTasks = tasks.filter(task => task.status === "completed")

  return (
    <div>
      {/* Navigation button */}
      <div className="fixed top-6 left-6">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => router.push("/")}
        >
          <Home className="w-4 h-4" />
          Projects
        </Button>
      </div>

      <div className="p-6 max-w-5xl mx-auto">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            {getStatusIcon(project.status)}
            <h1 className="text-2xl font-bold">{project.name}</h1>
          </div>
          <p className="text-gray-600">{project.description}</p>
        </div>

        {/* To do tasks section */}
        <div className="mb-8">
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
            <>
              {todoTasks.length === 0 ? (
                <p className="text-gray-500">No tasks yet</p>
              ) : (
                <div className="space-y-2">
                  {todoTasks.map(task => (
                    <Card key={task.id}>
                      <CardContent className="p-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                          <div className="flex flex-col space-y-1">
                            <h3 className="text-sm font-medium truncate">{task.title}</h3>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                              <span className="truncate">{task.description}</span>
                              {task.due_date && (
                                <span>Due: {new Date(task.due_date).toLocaleString("en-GB")}</span>
                              )}
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
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Completed tasks section */}
        {completedTasks.length > 0 && (
          <div className="mb-8">
            <div
              className="flex justify-between items-center mb-4 cursor-pointer"
              onClick={() => setCompletedOpen(!completedOpen)}
            >
              <h2 className="text-xl font-semibold">Completed tasks ({completedTasks.length})</h2>
              {completedOpen ? (
                <ChevronDown className="w-6 h-6" />
              ) : (
                <ChevronRight className="w-6 h-6" />
              )}
            </div>
            {completedOpen && (
              <div className="space-y-2">
                {completedTasks.map(task => (
                  <Card key={task.id}>
                    <CardContent className="p-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                        <div className="flex flex-col space-y-1">
                          <h3 className="text-sm font-medium truncate">{task.title}</h3>
                          <div className="flex items-center space-x-2 text-xs text-gray-500">
                            <span className="truncate">{task.description}</span>
                            {task.due_date && (
                              <span>Due: {new Date(task.due_date).toLocaleString("en-GB")}</span>
                            )}
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
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KPIs section */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">KPIs</h2>
            <NewKPIDialog
              projectId={project.id}
              onKPICreated={(newKpi: KPI) => setKpis(prevKpis => [newKpi, ...prevKpis])}
            />
          </div>
          {kpis.length === 0 ? (
            <p className="text-gray-500">No KPIs yet</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">KPI</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Measure Date</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Result</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {kpis.map(kpi => (
                    <tr key={kpi.id} className="bg-white">
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
                              )
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
        </div>
        <div className="mb-8">
              <ProjectComments projectId={project.id} />
        </div>
      </div>
    </div>
  )
}