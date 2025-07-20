'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';

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
  onTaskUpdate?: (task: Task) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  initialData, 
  onTaskMove 
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

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getColumnStyle = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return 'bg-slate-50 border-slate-200';
      case 'inprogress':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getColumnHeaderStyle = (columnId: string) => {
    switch (columnId) {
      case 'todo':
        return 'text-slate-700 border-b-slate-200';
      case 'inprogress':
        return 'text-blue-700 border-b-blue-200';
      case 'completed':
        return 'text-green-700 border-b-green-200';
      default:
        return 'text-gray-700 border-b-gray-200';
    }
  };

  return (
    <div className="w-full h-full p-6" style={{ backgroundColor: '#f8fafc' }}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
        {columns.map((column) => (
          <div
            key={column.id}
            className={`flex flex-col h-full min-h-[600px] rounded-lg border-2 ${getColumnStyle(column.id)}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column.id)}
          >
            <div 
              className={`p-4 border-b-2 ${getColumnHeaderStyle(column.id)}`}
              style={{ backgroundColor: '#1c3145' }}
            >
              <h3 className="font-semibold text-lg text-white">
                {column.title}
              </h3>
              <div className="mt-1">
                <span 
                  className="inline-block px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{ backgroundColor: '#81bb26' }}
                >
                  {column.tasks.length} tasks
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-4 space-y-3 overflow-y-auto">
              {column.tasks.map((task) => (
                <Card
                  key={task.id}
                  className="cursor-move hover:shadow-md transition-shadow duration-200 border-2"
                  draggable
                  onDragStart={(e) => handleDragStart(e, task, column.id)}
                  style={{ borderColor: '#e2e8f0' }}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <h4 
                        className="font-medium text-sm leading-tight"
                        style={{ color: '#1c3145' }}
                      >
                        {task.title}
                      </h4>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 leading-relaxed">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        {task.assignee && (
                          <span 
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ backgroundColor: '#81bb26', color: 'white' }}
                          >
                            {task.assignee}
                          </span>
                        )}
                        
                        {task.priority && (
                          <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        )}
                      </div>
                      
                      {task.dueDate && (
                        <div className="text-xs text-gray-500 pt-1">
                          Due: {task.dueDate}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">No tasks yet</p>
                  <p className="text-xs mt-1">Drag tasks here to get started</p>
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