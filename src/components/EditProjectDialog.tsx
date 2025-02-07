"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Project } from "@/types/database.types"
import { Pencil } from "lucide-react"
import { createClient } from "@/utils/supabase/client"

interface EditProjectDialogProps {
  project: Project
  onProjectUpdated: (updatedProject: Project) => void
}

export default function EditProjectDialog({ project, onProjectUpdated }: EditProjectDialogProps) {
  const supabase = createClient();

  const [open, setOpen] = useState(false)
  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description || "")
  const [isLoading, setIsLoading] = useState(false)

  // When the dialog opens, initialize the fields with the current project data
  useEffect(() => {
    if (open) {
      setName(project.name)
      setDescription(project.description || "")
    }
  }, [open, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { data, error } = await supabase
        .from("projects")
        .update({ name, description })
        .eq("id", project.id)
        .select()
        .single()
      if (error) throw error
      if (data) {
        onProjectUpdated(data)
        setOpen(false)
      }
    } catch (error) {
      console.error("Error updating project:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label htmlFor="project-name-edit" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="project-name-edit"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="project-description-edit" className="text-sm font-medium">
              Project Description
            </label>
            <Input
              id="project-description-edit"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Project Description"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}