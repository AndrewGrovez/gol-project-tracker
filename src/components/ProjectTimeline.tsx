// src/components/ProjectTimeline.tsx
// This component provides a visual timeline of project tasks
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { addDays, format, differenceInDays, isAfter, isBefore, isToday } from "date-fns";
import { createClient } from "@/utils/supabase/client";
import type { Task } from "@/types/database.types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

interface ProjectTimelineProps {
  projectId: string;
}

export default function ProjectTimeline({ projectId }: ProjectTimelineProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timelineStart, setTimelineStart] = useState<Date>(new Date());
  const [timelineEnd, setTimelineEnd] = useState<Date>(addDays(new Date(), 30));
  const [hoveredTask, setHoveredTask] = useState<Task | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  // Number of days to display in the timeline
  const daysToShow = 30;

  useEffect(() => {
    async function fetchTasks() {
      try {
        setLoading(true);
        setError(null);

        // Fetch tasks for this project
        const { data, error } = await supabase
          .from("tasks")
          .select("*")
          .eq("project_id", projectId)
          .order("due_date", { ascending: true });

        if (error) throw error;

        // If tasks are available, set the timeline to start from the earliest task due date
        if (data && data.length > 0) {
          const tasksWithDates = data.filter(task => task.due_date);
          
          if (tasksWithDates.length > 0) {
            // Sort tasks by due date
            const sortedTasks = [...tasksWithDates].sort((a, b) => {
              if (!a.due_date) return 1;
              if (!b.due_date) return -1;
              return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
            });
            
            // Get earliest and latest due dates
            const earliestDueDate = new Date(sortedTasks[0].due_date!);
            const latestDueDate = new Date(sortedTasks[sortedTasks.length - 1].due_date!);
            
            // If earliest due date is in the future, use today as start
            // Otherwise use the earliest due date
            const start = isBefore(earliestDueDate, new Date()) ? earliestDueDate : new Date();
            
            // Make sure our timeline spans at least daysToShow days
            const potentialEnd = addDays(start, daysToShow);
            const end = isAfter(potentialEnd, latestDueDate) ? potentialEnd : addDays(latestDueDate, 5);
            
            setTimelineStart(start);
            setTimelineEnd(end);
          }
        }

        setTasks(data || []);
      } catch (err) {
        console.error("Error:", err);
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    }

    fetchTasks();
  }, [projectId, supabase]);

  const scrollTimelineLeft = () => {
    setTimelineStart(addDays(timelineStart, -7));
    setTimelineEnd(addDays(timelineEnd, -7));
  };

  const scrollTimelineRight = () => {
    setTimelineStart(addDays(timelineStart, 7));
    setTimelineEnd(addDays(timelineEnd, 7));
  };

  const resetTimeline = () => {
    setTimelineStart(new Date());
    setTimelineEnd(addDays(new Date(), daysToShow));
  };

  const handleTaskClick = (task: Task) => {
    setHoveredTask(task);
    setIsDialogOpen(true);
  };

  // Generate the dates for the timeline header
  const generateTimelineDates = () => {
    const dates = [];
    const dayCount = differenceInDays(timelineEnd, timelineStart) + 1;
    
    for (let i = 0; i < dayCount; i++) {
      dates.push(addDays(timelineStart, i));
    }
    
    return dates;
  };

  const timelineDates = generateTimelineDates();

  // Position a task on the timeline
  const getTaskPosition = (task: Task) => {
    if (!task.due_date) return { display: 'none' };
    
    const taskDate = new Date(task.due_date);
    
    // If task is outside our visible range, don't display it
    if (isBefore(taskDate, timelineStart) || isAfter(taskDate, timelineEnd)) {
      return { display: 'none' };
    }
    
    // Calculate position as percentage of timeline width
    const totalDays = differenceInDays(timelineEnd, timelineStart) + 1;
    const daysFromStart = differenceInDays(taskDate, timelineStart);
    const leftPosition = (daysFromStart / totalDays) * 100;
    
    return {
      left: `${leftPosition}%`,
      transform: 'translateX(-50%)', // Center the task marker
    };
  };

  // Get status color for a task
  const getTaskStatusColor = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'in_progress':
        return 'bg-blue-500';
      case 'blocked':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded mb-4"></div>
        <div className="h-64 bg-gray-100 rounded"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Project Timeline</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={scrollTimelineLeft}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={resetTimeline}>
            <Calendar className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={scrollTimelineRight}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-x-auto">
        <CardContent className="p-4">
          {tasks.filter(task => task.due_date).length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No tasks with due dates found. Add task due dates to see the timeline.
            </div>
          ) : (
            <div className="min-w-[800px]">
              {/* Timeline Header - Days */}
              <div className="grid grid-cols-[150px_1fr] border-b">
                <div className="px-4 py-2 font-medium">Task</div>
                <div className="relative">
                  <div className="grid" style={{ gridTemplateColumns: `repeat(${timelineDates.length}, 1fr)` }}>
                    {timelineDates.map((date, idx) => (
                      <div key={idx} className={`
                        px-1 py-2 text-center text-xs border-r
                        ${isToday(date) ? 'bg-blue-50 font-bold' : ''}
                      `}>
                        {format(date, 'MMM d')}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Timeline Rows - Tasks */}
              {tasks
                .filter(task => task.due_date)
                .map((task) => (
                  <div key={task.id} className="grid grid-cols-[150px_1fr] border-b hover:bg-gray-50">
                    <div className="px-4 py-3 truncate">{task.title}</div>
                    <div className="relative h-10">
                      <div 
                        className={`absolute h-6 w-6 rounded-full ${getTaskStatusColor(task.status)} top-2 cursor-pointer`}
                        style={getTaskPosition(task)}
                        onClick={() => handleTaskClick(task)}
                        onMouseEnter={() => setHoveredTask(task)}
                        onMouseLeave={() => setHoveredTask(null)}
                      >
                        {hoveredTask?.id === task.id && (
                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                            {task.title} - {task.due_date ? format(new Date(task.due_date), 'MMM d, yyyy') : 'No date'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Task Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
          <DialogContent className="fixed top-1/2 left-1/2 z-50 w-full max-w-md transform -translate-x-1/2 -translate-y-1/2 rounded-lg bg-white p-6 shadow-lg">
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            
            {hoveredTask && (
              <div className="mt-4 space-y-4">
                <div>
                  <h4 className="text-lg font-medium">{hoveredTask.title}</h4>
                  {hoveredTask.description && (
                    <p className="mt-2 text-gray-600">{hoveredTask.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-medium">
                      {hoveredTask.status === 'in_progress' ? 'In Progress' : 
                       hoveredTask.status.charAt(0).toUpperCase() + hoveredTask.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Due Date</p>
                    <p className="font-medium">
                      {hoveredTask.due_date ? format(new Date(hoveredTask.due_date), 'MMM d, yyyy') : 'None'}
                    </p>
                  </div>
                </div>
                
                {hoveredTask.recurrence !== 'none' && (
                  <div>
                    <p className="text-sm text-gray-500">Recurrence</p>
                    <p className="font-medium">
                      {hoveredTask.recurrence.charAt(0).toUpperCase() + hoveredTask.recurrence.slice(1)}
                      {hoveredTask.recurrence === 'weekly' && hoveredTask.recurrence_days && hoveredTask.recurrence_days.length > 0 && (
                        <span className="ml-1 text-sm text-gray-600">
                          (on {hoveredTask.recurrence_days.join(', ')})
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
            
            <div className="mt-6 flex justify-end">
              <Button 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </DialogPrimitive.Portal>
      </Dialog>
    </div>
  );
}
