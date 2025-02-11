"use client"

import React, { useEffect, useState } from "react"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, Trash2, ChevronDown, ChevronRight } from "lucide-react"
import type { Project } from "@/types/database.types"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import NewProjectDialog from "@/components/NewProjectDialog"
import EditProjectDialog from "@/components/EditProjectDialog"
import { createClient } from "@/utils/supabase/client"

export default function ProjectList() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  // State to control collapsible sections
  const [activeOpen, setActiveOpen] = useState(true)
  const [completedOpen, setCompletedOpen] = useState(false) // Completed projects collapsed by default
  const supabase = createClient()
  const [displayName, setDisplayName] = useState<string>()

  // Helper function to get greeting based on current UK time
  const getGreeting = (): string => {
    const now = new Date()
    // Convert current time to UK time using the 'en-GB' locale and the 'Europe/London' time zone
    const ukTime = new Date(
      now.toLocaleString("en-GB", { timeZone: "Europe/London" })
    )
    const hour = ukTime.getHours()

    if (hour < 12) {
      return "Bore Da"
    } else if (hour < 17) {
      return "Prynhawn Da"
    } else {
      return "Good Ebening"
    }
  }

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", session.user.id)
        .single()
        .then((res) => setDisplayName(res.data?.display_name))
    }
    getUser()
  }, [supabase])

  useEffect(() => {
    async function checkSessionAndFetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      console.log(session)
      if (!session) {
        router.push("/login")
      } else {
        const { error: profileError } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", session.user.id)
          .single()
        if (profileError) {
          console.error("Error fetching profile:", profileError)
        }
      }
    }
    checkSessionAndFetchProfile()
  }, [router, supabase])

  // Fetch projects list
  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .order("created_at", { ascending: false })
        if (error) throw error
        setProjects(data || [])
      } catch (err) {
        console.error("Error:", err)
        setError("Failed to load projects")
      } finally {
        setLoading(false)
      }
    }
    fetchProjects()
  }, [supabase])

  const toggleProjectCompletion = async (projectId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("projects")
        .update({ completed: !currentStatus })
        .eq("id", projectId)
      if (error) throw error
      setProjects((currentProjects) =>
        currentProjects.map((project) =>
          project.id === projectId
            ? { ...project, completed: !currentStatus }
            : project
        )
      )
    } catch (error) {
      console.error("Error toggling project completion:", error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId)
      if (error) throw error
      setProjects((currentProjects) =>
        currentProjects.filter((project) => project.id !== projectId)
      )
    } catch (error) {
      console.error("Error deleting project:", error)
    }
  }

  const activeProjects = projects.filter((project) => !project.completed)
  const completedProjects = projects.filter((project) => project.completed)

  if (loading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 w-48 bg-gray-200 rounded mb-6"></div>
          {[1, 2, 3].map((n) => (
            <div key={n} className="mb-4 h-24 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Flashy, dynamic greeting section */}
      <div
        className="mb-4 text-3xl font-extrabold text-center bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 text-transparent bg-clip-text transition-transform duration-300 ease-in-out hover:scale-105"
      >
        {getGreeting()}, {displayName}
      </div>

      {displayName && ["Andrew", "Jake", "Steve", "Aaron"].includes(displayName) && (
      <div className="my-4 flex justify-center">
      <Image
      src="/motivational/dodgeball.jpg"
      alt="Motivational Dodgeball"
      width={175}
      height={80}
      className="rounded-md shadow-lg"
      />
  </div>
)}



      {/* Header with NewProjectDialog */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Projects</h2>
        <NewProjectDialog
          onProjectCreated={(newProject: Project) =>
            setProjects((prevProjects) => [newProject, ...prevProjects])
          }
        />
      </div>

      {/* Separator above Active Projects */}
      <hr className="mb-8 border-gray-200" />

      {/* Active Projects Section */}
      <section className="mb-8">
        <div
          className="flex items-center justify-between mb-6 cursor-pointer"
          onClick={() => setActiveOpen(!activeOpen)}
        >
          <h2 className="text-2xl font-bold">
            Active Projects ({activeProjects.length})
          </h2>
          {activeOpen ? (
            <ChevronDown className="w-6 h-6" />
          ) : (
            <ChevronRight className="w-6 h-6" />
          )}
        </div>
        {activeOpen && (
          <div className="grid gap-4">
            {activeProjects.map((project) => (
              <Card key={project.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/projects/${project.id}`)}
                    >
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <p className="text-gray-500 text-sm">{project.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
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
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => deleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:bg-green-50 hover:text-green-700"
                        onClick={() => toggleProjectCompletion(project.id, project.completed)}
                      >
                        <CheckCircle className="w-5 h-5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Separator above Completed Projects */}
      <hr className="mb-8 border-gray-200" />

      {/* Completed Projects Section */}
      {completedProjects.length > 0 && (
        <section>
          <div
            className="flex items-center justify-between mb-6 cursor-pointer"
            onClick={() => setCompletedOpen(!completedOpen)}
          >
            <h2 className="text-2xl font-bold">
              Completed Projects ({completedProjects.length})
            </h2>
            {completedOpen ? (
              <ChevronDown className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
          </div>
          {completedOpen && (
            <div className="grid gap-4">
              {completedProjects.map((project) => (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => router.push(`/projects/${project.id}`)}
                      >
                        <h3 className="text-lg font-semibold">{project.name}</h3>
                        <p className="text-gray-500 text-sm">{project.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
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
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-green-600 hover:bg-green-50 hover:text-green-700"
                          onClick={() => toggleProjectCompletion(project.id, project.completed)}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  )
}