import { fetchClient } from "../lib/fetchClient";
import type { AuthUser } from "../types/auth.types";

export interface LoginInput {
  email: string;
  password: string;
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

interface LoginResponseData {
  user: AuthUser;
  token: string;
}

interface SignupResponseData {
  _id: string;
  name: string;
  email: string;
  role: "admin" | "member";
  status: "pending" | "active" | "rejected";
}

export const authService = {
  login: (payload: LoginInput) =>
    fetchClient<ApiResponse<LoginResponseData>>("/auth/login", {
      method: "POST",
      body: payload,
    }),

  signup: (payload: SignupInput) =>
    fetchClient<ApiResponse<SignupResponseData>>("/auth/signup", {
      method: "POST",
      body: payload,
    }),
};
