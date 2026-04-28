import { useCallback, useMemo, useState, type ReactNode } from "react";
import { AuthContext } from "./AuthContext";
import {
  authService,
  type LoginInput,
  type SignupInput,
} from "../services/auth.service";
import type { AuthContextType, AuthUser } from "../types/auth.types";

const AUTH_STORAGE_KEY = "capstone_auth";

interface StoredAuth {
  user: AuthUser;
  token: string;
}

interface AuthProviderProps {
  children: ReactNode;
}

const getStoredAuth = (): StoredAuth | null => {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);

    if (!stored) {
      return null;
    }

    const parsed = JSON.parse(stored) as StoredAuth;

    if (!parsed?.user || !parsed?.token) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [storedAuth] = useState<StoredAuth | null>(() => getStoredAuth());

  const [user, setUser] = useState<AuthUser | null>(
    () => storedAuth?.user ?? null,
  );
  const [token, setToken] = useState<string | null>(
    () => storedAuth?.token ?? null,
  );
  const [isLoading] = useState(false);

  const persistAuth = useCallback((authUser: AuthUser, authToken: string) => {
    const payload: StoredAuth = {
      user: authUser,
      token: authToken,
    };

    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(payload));
    setUser(authUser);
    setToken(authToken);
  }, []);

  const clearAuth = useCallback(() => {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setUser(null);
    setToken(null);
  }, []);

  const login = useCallback(
    async (payload: LoginInput) => {
      const response = await authService.login(payload);
      const authData = response.data;

      if (!authData?.user || !authData?.token) {
        throw new Error("Invalid login response");
      }

      persistAuth(authData.user, authData.token);
    },
    [persistAuth],
  );

  const signup = useCallback(async (payload: SignupInput) => {
    await authService.signup(payload);
  }, []);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const setAuth = useCallback(
    (authUser: AuthUser, authToken: string) => {
      persistAuth(authUser, authToken);
    },
    [persistAuth],
  );

  const value: AuthContextType = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user && user.status === "active",
      isLoading,
      login,
      signup,
      logout,
      setAuth,
    }),
    [user, token, isLoading, login, signup, logout, setAuth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
