import { fetchClient } from "../lib/fetchClient";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "active" | "rejected";
  createdAt?: string;
  updatedAt?: string;
}

interface PendingUsersResponse {
  count: number;
  users: User[];
}

export interface UserItem {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export const userService = {
  getActiveUsers: (token: string) =>
    fetchClient<ApiResponse<{ count: number; users: UserItem[] }>>(
      "/users?status=active",
      {
        method: "GET",
        token,
      },
    ),
  getPendingUsers: (token: string) =>
    fetchClient<ApiResponse<PendingUsersResponse>>("/users/pending", {
      method: "GET",
      token,
    }),

  approveUser: (userId: string, token: string) =>
    fetchClient<ApiResponse<User>>(`/users/${userId}/approve`, {
      method: "PATCH",
      token,
    }),

  rejectUser: (userId: string, token: string) =>
    fetchClient<ApiResponse<User>>(`/users/${userId}/reject`, {
      method: "PATCH",
      token,
    }),
};
