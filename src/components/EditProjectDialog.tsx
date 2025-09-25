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
import type { Project } from "@/types/database.types";
import { Pencil } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

// Extend the Project type locally to include allowed_users.
type ExtendedProject = Project & { allowed_users?: string[] };

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated: (updatedProject: Project) => void;
}

export default function EditProjectDialog({ project, onProjectUpdated }: EditProjectDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || "");
  // Initialize allowedUsers from the project, using our extended type.
  const [allowedUsers, setAllowedUsers] = useState<string[]>((project as ExtendedProject).allowed_users || []);
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // When the dialog opens, reinitialize our state from the project.
  useEffect(() => {
    if (open) {
      setName(project.name);
      setDescription(project.description || "");
      setAllowedUsers((project as ExtendedProject).allowed_users || []);
    }
  }, [open, project]);

  // Fetch current user and available profiles from Supabase.
  useEffect(() => {
    const fetchUserAndProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id, display_name");
        if (profilesError) {
          console.error("Error fetching profiles:", profilesError);
        } else if (profilesData) {
          setProfiles(profilesData);
        }
      }
    };
    fetchUserAndProfiles();
  }, [supabase]);

  // Toggle selection for allowed users.
  // We prevent removal of the current user.
  const toggleUserSelection = (userId: string) => {
    if (allowedUsers.includes(userId)) {
      if (userId === currentUserId) return; // Prevent removing the creator.
      setAllowedUsers(allowedUsers.filter((id) => id !== userId));
    } else {
      setAllowedUsers([...allowedUsers, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Ensure the current user is always in the allowed users list.
      const updatedAllowedUsers = [...allowedUsers];
      if (!updatedAllowedUsers.includes(currentUserId)) {
        updatedAllowedUsers.push(currentUserId);
      }
      // Update the project with the new name, description, and allowed_users.
      const { data, error } = await supabase
        .from("projects")
        .update({
          name,
          description,
          allowed_users: updatedAllowedUsers,
        })
        .eq("id", project.id)
        .select()
        .single();
      if (error) throw error;
      if (data) {
        onProjectUpdated(data);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error updating project:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 bg-white/10 p-2 text-white hover:bg-white/20"
        >
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Allowed Users</label>
              <div className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <label key={profile.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={allowedUsers.includes(profile.id)}
                      onChange={() => toggleUserSelection(profile.id)}
                      className="mr-2"
                    />
                    {profile.display_name}
                  </label>
                ))}
              </div>
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
      </DialogPrimitive.Portal>
    </Dialog>
  );
}
