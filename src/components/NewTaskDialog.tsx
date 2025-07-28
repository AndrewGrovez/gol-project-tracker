"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import type { Task } from "@/types/database.types";
import { Plus } from "lucide-react";
import { DatePicker, TimePicker } from "rsuite";
import "rsuite/dist/rsuite.min.css";
import { Select } from "@/components/ui/select";
import { createClient } from "@/utils/supabase/client";

interface NewTaskDialogProps {
  projectId: string;
  onTaskCreated: (task: Task) => void;
}

export default function NewTaskDialog({ projectId, onTaskCreated }: NewTaskDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [dueTime, setDueTime] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);
  const [recurrence, setRecurrence] = useState<'none' | 'daily' | 'weekly' | 'monthly'>("none");
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProfiles() {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name");
      if (!error && data) {
        setProfiles(data);
      } else {
        console.error("Error fetching profiles", error);
      }
    }
    fetchProfiles();
  }, [supabase]);

  const toggleRecurrenceDay = (day: string) => {
    setRecurrenceDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    let combinedDueDate: Date | null = null;
    if (dueDate) {
      const datePart = dueDate;
      const timePart = dueTime || new Date(0);
      combinedDueDate = new Date(
        datePart.getFullYear(),
        datePart.getMonth(),
        datePart.getDate(),
        timePart.getHours(),
        timePart.getMinutes(),
        timePart.getSeconds()
      );
    }

    try {
      const { data, error } = await supabase
        .from("tasks")
        .insert([
          {
            project_id: projectId,
            title,
            description,
            status: "todo",
            due_date: combinedDueDate ? combinedDueDate.toISOString() : null,
            assigned_to: assignedTo || null,
            recurrence,
            recurrence_days: recurrence === "weekly" ? recurrenceDays : [],
          },
        ])
        .select()
        .single();

      if (error) throw error;

      if (data) {
        onTaskCreated(data);
        
        // Send notification if task is assigned to someone
        if (assignedTo) {
          console.log('📧 Attempting to send notification for assignment:', { taskId: data.id, assignedTo });
          try {
            const { data: { user } } = await supabase.auth.getUser();
            console.log('👤 Current user for notification:', user?.id);
            
            const response = await fetch('/api/notifications/task-assignment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                taskId: data.id,
                assignedToUserId: assignedTo,
                assignedByUserId: user?.id
              })
            });
            
            const result = await response.json();
            console.log('📧 Notification response:', { status: response.status, result });
            
            if (!response.ok) {
              console.error('❌ Notification failed:', result);
            } else {
              console.log('✅ Notification sent successfully:', result);
            }
          } catch (notificationError) {
            console.error("❌ Error sending notification:", notificationError);
          }
        } else {
          console.log('ℹ️ No assignment made, skipping notification');
        }
        
        setTitle("");
        setDescription("");
        setDueDate(null);
        setDueTime(null);
        setAssignedTo("");
        setRecurrence("none");
        setRecurrenceDays([]);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating task:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </DialogTrigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 w-full max-w-md bg-white p-6 rounded-lg shadow-lg transform -translate-x-1/2 -translate-y-1/2">
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">Title</label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" required />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Description</label>
              <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Task description" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Due Date &amp; Time</label>
              <div className="flex flex-col md:flex-row gap-2">
                <DatePicker placeholder="Select due date" style={{ width: "100%" }} value={dueDate} onChange={setDueDate} format="dd/MM/yyyy" />
                <TimePicker placeholder="Select time" style={{ width: "100%" }} value={dueTime} onChange={setDueTime} format="HH:mm" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium block">Recurrence</label>
              <Select value={recurrence} onChange={(e) => setRecurrence(e.target.value as 'none' | 'daily' | 'weekly' | 'monthly')} className="min-w-[130px] text-sm">
                <option value="none">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
            {recurrence === "weekly" && (
              <div className="space-y-2">
                <label className="text-sm font-medium block">Repeat on</label>
                <div className="flex gap-2">
                  {weekdays.map(day => (
                    <label key={day} className="flex items-center gap-1">
                      <input type="checkbox" value={day} checked={recurrenceDays.includes(day)} onChange={() => toggleRecurrenceDay(day)} className="w-4 h-4" />
                      <span className="text-sm">{day}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium block">Assign To</label>
              <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="min-w-[130px] text-sm">
                <option value="">Unassigned</option>
                {profiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.display_name}</option>
                ))}
              </Select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isLoading}>{isLoading ? "Creating..." : "Create Task"}</Button>
            </div>
          </form>
        </DialogContent>
      </DialogPrimitive.Portal>
    </Dialog>
  );
}