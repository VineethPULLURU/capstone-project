import { fetchClient } from "../lib/fetchClient";
import type { DashboardSummary } from "../types/dashboard.types";

interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
}

export const dashboardService = {
  getSummary: (token: string) =>
    fetchClient<ApiResponse<DashboardSummary>>("/dashboard/summary", {
      method: "GET",
      token,
    }),
};
