import { apiClient } from "./client";
import type { ProcedureMasterOut, ProcedureMasterCreate } from "../types/procedure";

export const procedureApi = {
  list: () => apiClient.get<ProcedureMasterOut[]>("/procedures"),
  create: (data: ProcedureMasterCreate) =>
    apiClient.post<ProcedureMasterOut>("/procedures", data),
  update: (id: number, data: ProcedureMasterCreate) =>
    apiClient.put<ProcedureMasterOut>(`/procedures/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/procedures/${id}`),
};
