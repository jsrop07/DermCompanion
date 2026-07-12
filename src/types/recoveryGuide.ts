export interface RecoveryGuideStepOut {
  id: number;
  guide_id: number;
  time_stage: string;
  offset_minutes: number;
  title?: string;
  precautions?: string;
  recommendations?: string;
  warning_symptoms?: string;
  sort_order: number;
}

export interface RecoveryGuideStepCreate {
  time_stage: string;
  offset_minutes: number;
  title?: string;
  precautions?: string;
  recommendations?: string;
  warning_symptoms?: string;
  sort_order?: number;
}

export interface RecoveryGuideListItem {
  id: number;
  name: string;
  procedure_type?: string;
  stages: number;
  lastModified: string;
}

export interface RecoveryGuideOut {
  id: number;
  name: string;
  procedure_type?: string;
  is_active: boolean;
  stages_count: number;
  last_modified?: string;
  steps: RecoveryGuideStepOut[];
}

export interface RecoveryGuideCreate {
  name: string;
  procedure_type?: string;
}
