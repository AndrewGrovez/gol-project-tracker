"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Input } from "@/components/ui/input";
import type { Project } from "@/types/database.types";
import { Plus } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface NewProjectDialogProps {
  onProjectCreated: (newProject: Project) => void;
}

export default function NewProjectDialog({ onProjectCreated }: NewProjectDialogProps) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for the current user ID
  const [currentUserId, setCurrentUserId] = useState<string>("");

  // State for the list of profiles (users) available for selection
  const [profiles, setProfiles] = useState<{ id: string; display_name: string }[]>([]);
  // State for storing the selected user IDs (for project access)
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Fetch the current user and available profiles
  useEffect(() => {
    const fetchUserAndProfiles = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);

        // Fetch available profiles from the profiles table
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

  // Toggle selection of a user ID
  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter((id) => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a project name");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // Combine the selected user IDs with the current user's ID.
      // This ensures the creator is always included.
      const allowedUsers = [...selectedUserIds];
      if (!allowedUsers.includes(currentUserId)) {
        allowedUsers.push(currentUserId);
      }

      // Insert the new project into the projects table with allowed_users set.
      const { data, error } = await supabase
        .from("projects")
        .insert([
          {
            name,
            description,
            completed: false,
            status: "not_started",
            allowed_users: allowedUsers,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        onProjectCreated(data);
        setName("");
        setDescription("");
        setSelectedUserIds([]);
        setOpen(false);
      }
    } catch (error) {
      console.error("Error creating project:", error);
      setError("Failed to create project");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Project
        </Button>
      </DialogTrigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>
              Enter a name, description, and select users who should have access to this project.
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
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Allowed Users</label>
              <div className="flex flex-col gap-2">
                {profiles.map((profile) => (
                  <label key={profile.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedUserIds.includes(profile.id)}
                      onChange={() => toggleUserSelection(profile.id)}
                      className="mr-2"
                    />
                    {profile.display_name}
                  </label>
                ))}
              </div>
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
  );
}
