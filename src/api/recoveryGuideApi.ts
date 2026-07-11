import { apiClient } from "./client";
import type {
  RecoveryGuideListItem, RecoveryGuideOut, RecoveryGuideCreate,
  RecoveryGuideStepOut, RecoveryGuideStepCreate,
} from "../types/recoveryGuide";

export const recoveryGuideApi = {
  list: () => apiClient.get<RecoveryGuideListItem[]>("/recovery-guides"),
  create: (data: RecoveryGuideCreate) =>
    apiClient.post<RecoveryGuideOut>("/recovery-guides", data),
  get: (id: number) => apiClient.get<RecoveryGuideOut>(`/recovery-guides/${id}`),
  update: (id: number, data: RecoveryGuideCreate) =>
    apiClient.put<RecoveryGuideOut>(`/recovery-guides/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/recovery-guides/${id}`),
  getSteps: (id: number) =>
    apiClient.get<RecoveryGuideStepOut[]>(`/recovery-guides/${id}/steps`),
  addStep: (id: number, data: RecoveryGuideStepCreate) =>
    apiClient.post<RecoveryGuideStepOut>(`/recovery-guides/${id}/steps`, data),
  updateStep: (guideId: number, stepId: number, data: RecoveryGuideStepCreate) =>
    apiClient.put<RecoveryGuideStepOut>(`/recovery-guides/${guideId}/steps/${stepId}`, data),
  deleteStep: (guideId: number, stepId: number) =>
    apiClient.delete<void>(`/recovery-guides/${guideId}/steps/${stepId}`),
};
