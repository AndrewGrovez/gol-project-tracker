export type Project = {
  id: string
  name: string
  description: string | null
  status: 'completed' | 'in_progress' | 'not_started' | 'delayed'
  completed: boolean
  created_at: string
  updated_at: string
  owner_id: string | null
}
  
export type Task = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'completed' | 'blocked';
  due_date: string | null;
  created_at: string;
  updated_at: string;
  assigned_to?: string | null; // Add this line
};
  
  export type Comment = {
    id: string
    project_id: string
    user_id: string
    content: string
    created_at: string
  }

  export type KPI = {
    id: string
    project_id: string
    title: string
    measure_date: string
    result: string
    created_at: string
    updated_at: string
  }