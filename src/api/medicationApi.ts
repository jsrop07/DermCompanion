import { apiClient } from "./client";
import type { MedicationMasterOut, MedicationMasterCreate } from "../types/medication";

export const medicationApi = {
  list: () => apiClient.get<MedicationMasterOut[]>("/medications"),
  create: (data: MedicationMasterCreate) =>
    apiClient.post<MedicationMasterOut>("/medications", data),
  update: (id: number, data: MedicationMasterCreate) =>
    apiClient.put<MedicationMasterOut>(`/medications/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/medications/${id}`),
};
