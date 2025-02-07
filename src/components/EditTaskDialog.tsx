"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type { Task } from "@/types/database.types"
import { DatePicker, TimePicker } from "rsuite"
import { Pencil } from "lucide-react"
import { Select } from "@/components/ui/select"
import { createClient } from "@/utils/supabase/client"

interface EditTaskDialogProps {
  task: Task
  onTaskUpdated: (updatedTask: Task) => void
}

export default function EditTaskDialog({ task, onTaskUpdated }: EditTaskDialogProps) {
  const supabase = createClient();

  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState(task.title)
  const [description, setDescription] = useState(task.description || "")
  const [dueDate, setDueDate] = useState<Date | null>(task.due_date ? new Date(task.due_date) : null)
  const [dueTime, setDueTime] = useState<Date | null>(task.due_date ? new Date(task.due_date) : null)
  const [assignedTo, setAssignedTo] = useState<string>(task.assigned_to || "")
  const [isLoading, setIsLoading] = useState(false)
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([])

  useEffect(() => {
    if (open) {
      setTitle(task.title)
      setDescription(task.description || "")
      setAssignedTo(task.assigned_to || "")
      if (task.due_date) {
        const date = new Date(task.due_date)
        setDueDate(date)
        setDueTime(date)
      }
    }
  }, [open, task])

  // Fetch profiles for assignment dropdown
  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name")
      if (!error && data) {
        setProfiles(data)
      } else {
        console.error("Error fetching profiles:", error)
      }
    }
    fetchProfiles()
  }, [supabase])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    let combinedDueDate: Date | null = null
    if (dueDate) {
      const datePart = dueDate
      const timePart = dueTime || new Date(0)
      combinedDueDate = new Date(
        datePart.getFullYear(),
        datePart.getMonth(),
        datePart.getDate(),
        timePart.getHours(),
        timePart.getMinutes(),
        timePart.getSeconds()
      )
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .update({
          title,
          description,
          due_date: combinedDueDate ? combinedDueDate.toISOString() : null,
          assigned_to: assignedTo || null,
        })
        .eq('id', task.id)
        .select()
        .single()

      if (error) throw error

      if (data) {
        onTaskUpdated(data)
        setOpen(false)
      }
    } catch (error) {
      console.error("Error updating task:", error)
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
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              required
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Task description"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium block">
              Due Date &amp; Time
            </label>
            <div className="flex flex-col md:flex-row gap-2">
              <DatePicker
                placeholder="Select due date"
                style={{ width: "100%" }}
                value={dueDate}
                onChange={setDueDate}
                format="dd/MM/yyyy"
              />
              <TimePicker
                placeholder="Select time"
                style={{ width: "100%" }}
                value={dueTime}
                onChange={setDueTime}
                format="HH:mm"
              />
            </div>
          </div>
          {/* Assignment dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium block">Assign To</label>
            <Select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="min-w-[130px] text-sm"
            >
              <option value="">Unassigned</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.display_name}
                </option>
              ))}
            </Select>
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