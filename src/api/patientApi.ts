import { apiClient } from "./client";
import type {
  PatientListItem, PatientDetailOut, PatientCreate, PatientUpdate,
  PatientMedicationCreate, PatientMedicationOut,
  MedicationLogCreate, MedicationLogOut, MedicationLogCalendarItem,
  StaffNoteCreate, StaffNoteOut, ProcedureOut,
} from "../types/patient";

export const patientApi = {
  list: (search?: string, statusFilter?: string) => {
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (statusFilter) params.append("status_filter", statusFilter);
    const query = params.toString();
    return apiClient.get<PatientListItem[]>(`/patients${query ? `?${query}` : ""}`);
  },
  create: (data: PatientCreate) => apiClient.post<PatientDetailOut>("/patients", data),
  get: (id: number) => apiClient.get<PatientDetailOut>(`/patients/${id}`),
  update: (id: number, data: PatientUpdate) =>
    apiClient.put<PatientDetailOut>(`/patients/${id}`, data),
  delete: (id: number) => apiClient.delete<void>(`/patients/${id}`),
  addProcedure: (patientId: number, data: { patient_id: number; procedure_name: string; procedure_date: string; procedure_time?: string; notes?: string }) =>
    apiClient.post<ProcedureOut>(`/patients/${patientId}/procedures`, data),

  // medications
  getMedications: (patientId: number) =>
    apiClient.get<PatientMedicationOut[]>(`/patients/${patientId}/medications`),
  addMedication: (patientId: number, data: PatientMedicationCreate) =>
    apiClient.post<PatientMedicationOut>(`/patients/${patientId}/medications`, data),
  updateMedication: (patientId: number, medId: number, data: PatientMedicationCreate) =>
    apiClient.put<PatientMedicationOut>(`/patients/${patientId}/medications/${medId}`, data),
  deleteMedication: (patientId: number, medId: number) =>
    apiClient.delete<void>(`/patients/${patientId}/medications/${medId}`),

  // medication logs
  getMedicationLogs: (patientId: number) =>
    apiClient.get<MedicationLogOut[]>(`/patients/${patientId}/medication-logs`),
  getMedicationLogsCalendar: (patientId: number) =>
    apiClient.get<MedicationLogCalendarItem[]>(`/patients/${patientId}/medication-logs/calendar`),
  addMedicationLog: (patientId: number, data: MedicationLogCreate) =>
    apiClient.post<MedicationLogOut>(`/patients/${patientId}/medication-logs`, data),

  // notes
  getNotes: (patientId: number) =>
    apiClient.get<StaffNoteOut[]>(`/patients/${patientId}/notes`),
  addNote: (patientId: number, data: StaffNoteCreate) =>
    apiClient.post<StaffNoteOut>(`/patients/${patientId}/notes`, data),
};
