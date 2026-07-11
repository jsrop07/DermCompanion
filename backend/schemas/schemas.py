from datetime import date, datetime, time
from typing import Optional, List
from pydantic import BaseModel, EmailStr


# ─── Auth ───────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_name: str
    user_role: str


# ─── Patient ────────────────────────────────────────────

class PatientBase(BaseModel):
    name: str
    phone: str
    birthdate: Optional[date] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    birthdate: Optional[date] = None
    medication_status_override: Optional[str] = None

class PatientOut(PatientBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Procedure ──────────────────────────────────────────

class ProcedureBase(BaseModel):
    procedure_name: str
    procedure_date: date
    procedure_time: Optional[time] = None
    notes: Optional[str] = None
    recovery_stage: Optional[str] = None
    recovery_progress: Optional[float] = 0.0
    recovery_guide_id: Optional[int] = None

class ProcedureCreate(ProcedureBase):
    patient_id: int

class ProcedureUpdate(BaseModel):
    procedure_name: Optional[str] = None
    procedure_date: Optional[date] = None
    procedure_time: Optional[time] = None
    notes: Optional[str] = None
    recovery_stage: Optional[str] = None
    recovery_progress: Optional[float] = None
    recovery_guide_id: Optional[int] = None
    
class ProcedureOut(ProcedureBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ProcedureMasterBase(BaseModel):
    name: str
    description: Optional[str] = None

class ProcedureMasterCreate(ProcedureMasterBase):
    pass

class ProcedureMasterOut(ProcedureMasterBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True

# ─── Patient Detail (combined) ──────────────────────────

class PatientDetailOut(BaseModel):
    id: int
    name: str
    phone: str
    birthdate: Optional[date] = None
    created_at: datetime
    procedure: Optional[ProcedureOut] = None
    medication_status: str = "정상"

    class Config:
        from_attributes = True


# ─── Patient List Item ──────────────────────────────────

class PatientListItem(BaseModel):
    id: int
    name: str
    procedure: Optional[str] = None
    date: Optional[str] = None
    stage: Optional[str] = None
    medicationStatus: str = "정상"
    lastUpdate: Optional[str] = None
    createdAt: Optional[str] = None

    class Config:
        from_attributes = True


# ─── Medication Master ──────────────────────────────────

class MedicationMasterBase(BaseModel):
    name: str
    default_dosage: Optional[str] = None
    default_frequency: Optional[str] = None
    purpose: Optional[str] = None

class MedicationMasterCreate(MedicationMasterBase):
    pass

class MedicationMasterOut(MedicationMasterBase):
    id: int
    is_active: bool

    class Config:
        from_attributes = True


# ─── Patient Medication ─────────────────────────────────

class PatientMedicationBase(BaseModel):
    medication_name: str
    dosage: Optional[str] = None
    frequency: Optional[str] = None
    purpose: Optional[str] = None

class PatientMedicationCreate(PatientMedicationBase):
    pass

class PatientMedicationOut(PatientMedicationBase):
    id: int
    patient_id: int
    adherence: float
    is_active: bool

    class Config:
        from_attributes = True


# ─── Medication Log ─────────────────────────────────────

class MedicationLogBase(BaseModel):
    medication_name: str
    scheduled_at: datetime
    status: str  # completed / missed

class MedicationLogCreate(MedicationLogBase):
    patient_medication_id: Optional[int] = None

class MedicationLogOut(MedicationLogBase):
    id: int
    patient_id: int

    class Config:
        from_attributes = True

class MedicationLogCalendarItem(BaseModel):
    date: str
    has_records: bool
    has_missed: bool


# ─── Recovery Guide ─────────────────────────────────────

class RecoveryGuideStepBase(BaseModel):
    time_stage: str
    title: Optional[str] = None
    precautions: Optional[str] = None
    recommendations: Optional[str] = None
    warning_symptoms: Optional[str] = None
    sort_order: int = 0

class RecoveryGuideStepCreate(RecoveryGuideStepBase):
    pass

class RecoveryGuideStepOut(RecoveryGuideStepBase):
    id: int
    guide_id: int

    class Config:
        from_attributes = True

class RecoveryGuideBase(BaseModel):
    name: str
    procedure_type: Optional[str] = None

class RecoveryGuideCreate(RecoveryGuideBase):
    pass

class RecoveryGuideOut(RecoveryGuideBase):
    id: int
    is_active: bool
    stages_count: int = 0
    last_modified: Optional[str] = None
    steps: List[RecoveryGuideStepOut] = []

    class Config:
        from_attributes = True

class RecoveryGuideListItem(BaseModel):
    id: int
    name: str
    procedure_type: Optional[str] = None
    stages: int
    lastModified: str

    class Config:
        from_attributes = True


# ─── Clinic Info ────────────────────────────────────────

class ClinicInfoBase(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    detail_address: Optional[str] = None
    weekday_hours: Optional[str] = None
    saturday_hours: Optional[str] = None
    closed_days: Optional[str] = None
    lunch_hours: Optional[str] = None
    notice: Optional[str] = None

class ClinicInfoUpdate(ClinicInfoBase):
    pass

class ClinicInfoOut(ClinicInfoBase):
    id: int

    class Config:
        from_attributes = True


# ─── Alert ──────────────────────────────────────────────

class AlertOut(BaseModel):
    id: int
    type: str
    patient: Optional[str] = None
    message: str
    time: Optional[str] = None
    is_read: bool

    class Config:
        from_attributes = True


# ─── Staff Note ─────────────────────────────────────────

class StaffNoteBase(BaseModel):
    content: str

class StaffNoteCreate(StaffNoteBase):
    pass

class StaffNoteOut(StaffNoteBase):
    id: int
    patient_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Dashboard ──────────────────────────────────────────

class DashboardSummary(BaseModel):
    today_patients: int
    active_recovery_patients: int
    missed_medication_patients: int

class DashboardAlert(BaseModel):
    id: int
    type: str
    patient: str
    message: str
    time: str
