export interface MedicationMasterOut {
  id: number;
  name: string;
  default_dosage?: string;
  default_frequency?: string;
  purpose?: string;
  is_active: boolean;
}

export interface MedicationMasterCreate {
  name: string;
  default_dosage?: string;
  default_frequency?: string;
  purpose?: string;
}
