export interface DashboardSummary {
  today_patients: number;
  active_recovery_patients: number;
  missed_medication_patients: number;
}

export interface DashboardAlert {
  id: number;
  type: string;
  patient: string;
  message: string;
  time: string;
}

export interface PatientListItem {
  id: number;
  name: string;
  procedure?: string;
  date?: string;
  stage?: string;
  medicationStatus: string;
  lastUpdate?: string;
}
