import { apiClient } from "./client";
import type { DashboardSummary, DashboardAlert, PatientListItem } from "../types/dashboard";

export const dashboardApi = {
  getSummary: () => apiClient.get<DashboardSummary>("/dashboard/summary"),
  getRecentPatients: () => apiClient.get<PatientListItem[]>("/dashboard/recent-patients"),
  getAlerts: () => apiClient.get<DashboardAlert[]>("/dashboard/alerts"),
};
