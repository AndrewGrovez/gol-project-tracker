'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import EditTaskDialog from './EditTaskDialog';
import type { Task as DatabaseTask } from '@/types/database.types';

interface Task {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  initialData?: KanbanColumn[];
  onTaskMove?: (taskId: string, fromColumn: string, toColumn: string) => void;
  onTaskUpdate?: (task: DatabaseTask) => void;
  tasks?: DatabaseTask[];
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  initialData, 
  onTaskMove,
  onTaskUpdate,
  tasks = [] 
}) => {
  const defaultData: KanbanColumn[] = [
    {
      id: 'todo',
      title: 'To Do',
      tasks: [
        { id: '1', title: 'Design new landing page', priority: 'high', assignee: 'John' },
        { id: '2', title: 'Update database schema', priority: 'medium', assignee: 'Sarah' },
      ]
    },
    {
      id: 'inprogress',
      title: 'In Progress',
      tasks: [
        { id: '3', title: 'Implement user authentication', priority: 'high', assignee: 'Mike' },
      ]
    },
    {
      id: 'completed',
      title: 'Completed',
      tasks: [
        { id: '4', title: 'Set up project repository', priority: 'medium', assignee: 'Alex' },
        { id: '5', title: 'Initial project planning', priority: 'low', assignee: 'Emma' },
      ]
    }
  ];

  const [columns, setColumns] = useState<KanbanColumn[]>(initialData || defaultData);
  const [draggedTask, setDraggedTask] = useState<{ task: Task; fromColumn: string } | null>(null);
  const [visibleTasksCount, setVisibleTasksCount] = useState<Record<string, number>>({});

  // Sync internal columns when parent-provided data changes (e.g., new tasks)
  useEffect(() => {
    if (initialData) {
      setColumns(initialData);
    }
  }, [initialData]);

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask({ task, fromColumn: columnId });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedTask || draggedTask.fromColumn === targetColumnId) {
      setDraggedTask(null);
      return;
    }

    const newColumns = columns.map(column => {
      if (column.id === draggedTask.fromColumn) {
        return {
          ...column,
          tasks: column.tasks.filter(task => task.id !== draggedTask.task.id)
        };
      }
      if (column.id === targetColumnId) {
        return {
          ...column,
          tasks: [...column.tasks, draggedTask.task]
        };
      }
      return column;
    });

    setColumns(newColumns);
    onTaskMove?.(draggedTask.task.id, draggedTask.fromColumn, targetColumnId);
    setDraggedTask(null);
  };


  // Columns share one quiet surface; only the accent dot distinguishes them.
  const getColumnAccent = (columnId: string) => {
    switch (columnId) {
      case 'inprogress':
        return '#81bb26';
      case 'completed':
        return '#94a3b8';
      default:
        return '#cbd5e1';
    }
  };

  const getVisibleTasks = (column: KanbanColumn) => {
    const visibleCount = visibleTasksCount[column.id] || 10;
    return column.tasks.slice(0, visibleCount);
  };

  const handleSeeMore = (columnId: string) => {
    setVisibleTasksCount(prev => ({
      ...prev,
      [columnId]: (prev[columnId] || 10) + 10
    }));
  };

  return (
    <div className="w-full h-full">
      <div className="grid h-full grid-cols-1 gap-3 md:grid-cols-3">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex h-full min-h-[520px] flex-col rounded-xl border border-slate-200/70 bg-slate-50/60"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div className="flex items-center gap-2 border-b border-slate-200/70 px-4 py-3">
              <span
                aria-hidden
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: getColumnAccent(column.id) }}
              />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {column.title}
              </h3>
              <span className="ml-auto text-xs font-semibold tabular-nums text-slate-400">
                {column.tasks.length}
              </span>
            </div>
            
            <div className="flex-1 space-y-2 overflow-y-auto p-3">
              {getVisibleTasks(column).map((task) => (
                <div key={task.id} className="relative group">
                  <Card
                    className="cursor-grab rounded-lg border border-slate-200/80 bg-white shadow-none transition-all duration-200 hover:-translate-y-px hover:border-slate-300 hover:shadow-[0_4px_12px_-4px_rgba(15,23,42,0.15)] active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, task, column.id)}
                  >
                    <CardContent className="p-3">
                      <div className="space-y-2">
                        <h4 className="pr-6 text-sm font-medium leading-snug text-[#1c3145]">
                          {task.title}
                        </h4>
                        
                        {task.description && (
                          <p className="line-clamp-2 text-xs leading-relaxed text-slate-500">
                            {task.description}
                          </p>
                        )}
                        
                        {(task.assignee || task.dueDate) && (
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 text-xs text-slate-400">
                            {task.assignee && (
                              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                                {task.assignee}
                              </span>
                            )}
                            {task.dueDate && <span className="tabular-nums">{task.dueDate}</span>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Edit button overlay */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {tasks.find(dbTask => dbTask.id === task.id) && onTaskUpdate && (
                      <EditTaskDialog
                        task={tasks.find(dbTask => dbTask.id === task.id)!}
                        onTaskUpdated={onTaskUpdate}
                      />
                    )}
                  </div>
                </div>
              ))}
              
              {column.tasks.length > (visibleTasksCount[column.id] || 10) && (
                <div className="text-center mt-4">
                  <button
                    onClick={() => handleSeeMore(column.id)}
                    className="w-full rounded-lg border border-slate-200/80 bg-white px-4 py-2 text-xs font-medium text-slate-500 transition-colors hover:border-slate-300 hover:text-[#1c3145]"
                  >
                    See more ({column.tasks.length - (visibleTasksCount[column.id] || 10)} more)
                  </button>
                </div>
              )}
              
              {column.tasks.length === 0 && (
                <div className="rounded-lg border border-dashed border-slate-200 py-8 text-center text-slate-400">
                  <p className="text-xs">Drag tasks here</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanBoard;
