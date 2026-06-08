export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  created_at?: string;
}

export type Priority = "low" | "medium" | "high";
export type Status = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  status: Status;
  creator_id: string;
  assignee_id?: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
  creator?: User;
  assignee?: User;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority: Priority;
  assignee_id?: string;
  due_date?: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  priority?: Priority;
  status?: Status;
  assignee_id?: string;
  due_date?: string;
}
