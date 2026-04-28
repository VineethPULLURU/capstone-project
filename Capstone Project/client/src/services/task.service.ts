import { fetchClient } from "../lib/fetchClient";
import type { Task } from "../types/task.types";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "in-progress" | "done";
  assignedTo?: string;
}

export const taskService = {
  getAll: (token: string) =>
    fetchClient<ApiResponse<{ count: number; tasks: Task[] }>>("/tasks", {
      method: "GET",
      token,
    }),

  getByProjectId: (projectId: string, token: string) =>
    fetchClient<ApiResponse<{ count: number; tasks: Task[] }>>(
      `/projects/${projectId}/tasks`,
      {
        method: "GET",
        token,
      },
    ),

  update: (taskId: string, payload: Record<string, unknown>, token: string) =>
    fetchClient<ApiResponse<Task>>(`/tasks/${taskId}`, {
      method: "PATCH",
      token,
      body: payload,
    }),

  createInProject: (
    projectId: string,
    payload: CreateTaskPayload,
    token: string,
  ) =>
    fetchClient<ApiResponse<Task>>(`/projects/${projectId}/tasks`, {
      method: "POST",
      token,
      body: payload,
    }),

  delete: (taskId: string, token: string) =>
    fetchClient<ApiResponse<null>>(`/tasks/${taskId}`, {
      method: "DELETE",
      token,
    }),
};
