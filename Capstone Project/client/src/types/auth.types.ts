import type { LoginInput, SignupInput } from "../services/auth.service";

export type UserRole = "admin" | "member";
export type UserStatus = "active" | "pending" | "rejected";

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginInput) => Promise<void>;
  signup: (payload: SignupInput) => Promise<void>;
  logout: () => void;
  setAuth: (authUser: AuthUser, authToken: string) => void;
}
