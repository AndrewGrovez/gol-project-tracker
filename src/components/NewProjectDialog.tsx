"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import * as DialogPrimitive from "@radix-ui/react-dialog" // Import Radix primitives for Portal & Overlay
import { Input } from "@/components/ui/input"
import type { Project } from "@/types/database.types"
import { Plus } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface NewProjectDialogProps {
  onProjectCreated: (newProject: Project) => void
}

export default function NewProjectDialog({ onProjectCreated }: NewProjectDialogProps) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("Please enter a project name")
      return
    }
    setIsLoading(true)
    setError(null)
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            completed: false,
            status: "not_started",
          },
        ])
        .select()
        .single()
      if (error) throw error
      if (data) {
        onProjectCreated(data)
        setName("")
        setDescription("")
        setOpen(false)
      }
    } catch (error) {
      console.error("Error creating project:", error)
      setError("Failed to create project")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </DialogTrigger>
      {/* Render the dialog content via Radix's Portal */}
      <DialogPrimitive.Portal>
        {/* Overlay covers the entire viewport with a blurred, semi-transparent background */}
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        {/* DialogContent is centred on the screen */}
        <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-md bg-white p-6 rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name and description for your new project.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="project-name" className="text-sm font-medium">
                Project Name
              </label>
              <Input
                id="project-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Project Name"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="project-description" className="text-sm font-medium">
                Project Description
              </label>
              <Input
                id="project-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Project Description"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <div className="flex justify-end mt-4 space-x-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </DialogPrimitive.Portal>
    </Dialog>
  )
}