export type TaskStatus = "todo" | "in-progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface PopulatedUser {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
}

export interface PopulatedProject {
  _id: string;
  name: string;
  description?: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  priority?: TaskPriority;
  status: TaskStatus;
  project?: string | PopulatedProject;
  assignedTo?: string | PopulatedUser | null;
  createdBy?: string | PopulatedUser | null;
  createdAt?: string;
  updatedAt?: string;
}