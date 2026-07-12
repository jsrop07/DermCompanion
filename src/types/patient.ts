export interface PatientListItem {
  id: number;
  name: string;
  procedure?: string;
  date?: string;
  stage?: string;
  medicationStatus: string;
  lastUpdate?: string;
  createdAt?: string;
}

export interface ProcedureOut {
  id: number;
  patient_id: number;
  procedure_name: string;
  procedure_date: string;
  procedure_time?: string;
  notes?: string;
  recovery_stage?: string;
  recovery_progress: number;
  recovery_guide_id?: number;
  created_at: string;
}

export interface ProcedureCreate {
  patient_id: number;
  procedure_name: string;
  procedure_date: string;
  procedure_time?: string;
  notes?: string;
  recovery_stage?: string;
  recovery_progress?: number;
  recovery_guide_id?: number;
}

export interface ProcedureUpdate {
  procedure_name?: string;
  procedure_date?: string;
  procedure_time?: string;
  notes?: string;
  recovery_stage?: string;
  recovery_progress?: number;
  recovery_guide_id?: number | null;
}

export interface PatientDetailOut {
  id: number;
  name: string;
  phone: string;
  birthdate?: string;
  created_at: string;
  procedure?: ProcedureOut;
  medication_status: string;
}

export interface PatientCreate {
  name: string;
  phone: string;
  birthdate?: string;
}

export interface PatientUpdate {
  name?: string;
  phone?: string;
  birthdate?: string;
  medication_status_override?: string;
}

export interface PatientMedicationOut {
  id: number;
  patient_id: number;
  medication_name: string;
  dosage?: string;
  frequency?: string;
  purpose?: string;
  adherence: number;
  is_active: boolean;
}

export interface PatientMedicationCreate {
  medication_name: string;
  dosage?: string;
  frequency?: string;
  purpose?: string;
}

export interface MedicationLogOut {
  id: number;
  patient_id: number;
  medication_name: string;
  scheduled_at: string;
  status: "completed" | "missed";
}

export interface MedicationLogCreate {
  medication_name: string;
  scheduled_at: string;
  status: "completed" | "missed";
  patient_medication_id?: number;
}

export interface MedicationLogCalendarItem {
  date: string;
  has_records: boolean;
  has_missed: boolean;
}

export interface StaffNoteOut {
  id: number;
  patient_id: number;
  content: string;
  created_at: string;
}

export interface StaffNoteCreate {
  content: string;
}

export interface StaffNoteUpdate {
  content: string;
}