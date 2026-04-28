import { fetchClient } from "../lib/fetchClient";
import type { Project } from "../types/project.types";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface ProjectMember {
  _id: string;
  name: string;
  email?: string;
  role?: string;
  status?: string;
}

interface MembersResponse {
  count: number;
  members: ProjectMember[];
}

interface ProjectsListResponse {
  count: number;
  projects: Project[];
}

export interface CreateProjectPayload {
  name: string;
  description?: string;
}

export interface UpdateMembersPayload {
  members: string[];
}

export const projectService = {
  getAll: (token: string) =>
    fetchClient<ApiResponse<ProjectsListResponse>>("/projects", {
      method: "GET",
      token,
    }),

  getById: (projectId: string, token: string) =>
    fetchClient<ApiResponse<Project>>(`/projects/${projectId}`, {
      method: "GET",
      token,
    }),

  addMembers: (projectId: string, members: string[], token: string) =>
    fetchClient<ApiResponse<Project>>(`/projects/${projectId}/members`, {
      method: "PATCH",
      token,
      body: { members },
    }),

  getMembers: (projectId: string, token: string) =>
    fetchClient<ApiResponse<MembersResponse>>(
      `/projects/${projectId}/members`,
      {
        method: "GET",
        token,
      },
    ),

  create: (payload: CreateProjectPayload, token: string) =>
    fetchClient<ApiResponse<Project>>("/projects", {
      method: "POST",
      token,
      body: payload,
    }),
};
