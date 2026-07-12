import os
from datetime import datetime, timedelta, time
from zoneinfo import ZoneInfo
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models.models import (
    Patient,
    Procedure,
    PatientMedication,
    MedicationLog,
    MedicationStatus,
    Alert,
    StaffNote,
    RecoveryGuide,
)
from schemas.schemas import (
    PatientCreate, PatientUpdate, PatientOut, PatientDetailOut, PatientListItem,
    PatientMedicationCreate, PatientMedicationOut,
    MedicationLogCreate, MedicationLogOut, MedicationLogCalendarItem,
    StaffNoteCreate, StaffNoteUpdate, StaffNoteOut,
    ProcedureCreate, ProcedureUpdate, ProcedureOut,
)

router = APIRouter(prefix="/patients", tags=["patients"])


def _med_status(patient: Patient, db: Session) -> str:
    if patient.medication_status_override:
        return patient.medication_status_override
    since = datetime.utcnow() - timedelta(hours=24)
    missed = db.query(MedicationLog).filter(
        MedicationLog.patient_id == patient.id,
        MedicationLog.status == MedicationStatus.missed,
        MedicationLog.scheduled_at >= since,
    ).first()
    return "누락" if missed else "정상"


def _relative_time(dt: datetime) -> str:
    diff = datetime.utcnow() - dt
    if diff.seconds < 3600 and diff.days == 0:
        return f"{max(1, diff.seconds // 60)}분 전"
    elif diff.days == 0:
        return f"{diff.seconds // 3600}시간 전"
    else:
        return f"{diff.days}일 전"

def _clinic_now() -> datetime:
    timezone_name = os.getenv(
        "CLINIC_TIMEZONE",
        "Asia/Seoul",
    )

    return (
        datetime.now(ZoneInfo(timezone_name))
        .replace(tzinfo=None)
    )


def _calculate_recovery_state(
    procedure: Optional[Procedure],
) -> tuple[Optional[str], float]:
    if (
        not procedure
        or not procedure.recovery_guide
        or not procedure.recovery_guide.steps
    ):
        return (
            procedure.recovery_stage
            if procedure
            else None,
            procedure.recovery_progress or 0.0
            if procedure
            else 0.0,
        )

    valid_steps = [
        step
        for step in procedure.recovery_guide.steps
        if step.offset_minutes is not None
    ]

    if not valid_steps:
        return (
            procedure.recovery_stage,
            procedure.recovery_progress or 0.0,
        )

    steps = sorted(
        valid_steps,
        key=lambda step: (
            step.offset_minutes,
            step.sort_order or 0,
            step.id,
        ),
    )

    procedure_time = (
        procedure.procedure_time
        or time(hour=0, minute=0)
    )

    started_at = datetime.combine(
        procedure.procedure_date,
        procedure_time,
    )

    elapsed_minutes = max(
        0.0,
        (
            _clinic_now() - started_at
        ).total_seconds() / 60,
    )

    final_offset = max(
        steps[-1].offset_minutes or 0,
        1,
    )

    if elapsed_minutes >= final_offset:
        return (
            steps[-1].time_stage,
            100.0,
        )

    current_step = steps[0]

    for step in steps:
        step_offset = step.offset_minutes or 0

        if elapsed_minutes >= step_offset:
            current_step = step
        else:
            break

    progress = min(
        99.9,
        max(
            0.0,
            elapsed_minutes
            / final_offset
            * 100,
        ),
    )

    return (
        current_step.time_stage,
        round(progress, 1),
    )


def _build_procedure_out(
    procedure: Procedure,
) -> ProcedureOut:
    recovery_stage, recovery_progress = (
        _calculate_recovery_state(procedure)
    )

    return (
        ProcedureOut
        .model_validate(procedure)
        .model_copy(
            update={
                "recovery_stage":
                    recovery_stage,
                "recovery_progress":
                    recovery_progress,
            }
        )
    )

# ─── Patient CRUD ───────────────────────────────────────

@router.get("", response_model=List[PatientListItem])
def list_patients(
    search: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Patient)
    if search:
        query = query.filter(Patient.name.contains(search))
    patients = query.order_by(Patient.created_at.desc()).all()

    today = datetime.utcnow().date()

    result = []
    for p in patients:
        proc = p.procedures[-1] if p.procedures else None
        med_status = _med_status(p, db)
        recovery_stage, recovery_progress = (
            _calculate_recovery_state(proc)
        )
        # Today filter: compare created_at date (UTC) with today's date (UTC)
        if status_filter == "today":
            if p.created_at.date() != today:
                continue

        # Medication filters
        if status_filter == "normal" and med_status != "정상":
            continue
        if status_filter == "missed" and med_status != "누락":
            continue

        # Recovery filters
        if status_filter == "recovering":
            if not proc or recovery_progress >= 100:
                continue

        if status_filter == "completed":
            if not proc or recovery_progress < 100:
                continue

        result.append(PatientListItem(
            id=p.id,
            name=p.name,
            procedure=proc.procedure_name if proc else None,
            date=str(proc.procedure_date) if proc else None,
            stage=recovery_stage,
            medicationStatus=med_status,
            lastUpdate=_relative_time(p.updated_at),
            createdAt=str(p.created_at.date()),
        ))
    return result



@router.post("", response_model=PatientOut, status_code=201)
def create_patient(data: PatientCreate, db: Session = Depends(get_db)):
    patient = Patient(**data.model_dump())
    db.add(patient)
    db.commit()
    db.refresh(patient)
    return patient


@router.get("/{patient_id}", response_model=PatientDetailOut)
def get_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")

    proc = patient.procedures[-1] if patient.procedures else None
    med_status = _med_status(patient, db)

    return PatientDetailOut(
        id=patient.id,
        name=patient.name,
        phone=patient.phone,
        birthdate=patient.birthdate,
        created_at=patient.created_at,
        procedure=_build_procedure_out(proc) if proc else None,
        medication_status=med_status,
    )


@router.put("/{patient_id}", response_model=PatientOut)
def update_patient(patient_id: int, data: PatientUpdate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(patient, key, value)
    db.commit()
    db.refresh(patient)
    return patient


@router.delete("/{patient_id}", status_code=204)
def delete_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    db.delete(patient)
    db.commit()


# ─── Patient Medications ────────────────────────────────

@router.get("/{patient_id}/medications", response_model=List[PatientMedicationOut])
def get_patient_medications(patient_id: int, db: Session = Depends(get_db)):
    return db.query(PatientMedication).filter(
        PatientMedication.patient_id == patient_id,
        PatientMedication.is_active == True,
    ).all()


@router.post("/{patient_id}/medications", response_model=PatientMedicationOut, status_code=201)
def add_patient_medication(
    patient_id: int, data: PatientMedicationCreate, db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    med = PatientMedication(patient_id=patient_id, **data.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put("/{patient_id}/medications/{medication_id}", response_model=PatientMedicationOut)
def update_patient_medication(
    patient_id: int, medication_id: int, data: PatientMedicationCreate, db: Session = Depends(get_db)
):
    med = db.query(PatientMedication).filter(
        PatientMedication.id == medication_id,
        PatientMedication.patient_id == patient_id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(med, key, value)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{patient_id}/medications/{medication_id}", status_code=204)
def delete_patient_medication(
    patient_id: int, medication_id: int, db: Session = Depends(get_db)
):
    med = db.query(PatientMedication).filter(
        PatientMedication.id == medication_id,
        PatientMedication.patient_id == patient_id,
    ).first()
    if not med:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")
    med.is_active = False
    db.commit()


# ─── Medication Logs ────────────────────────────────────

@router.get("/{patient_id}/medication-logs", response_model=List[MedicationLogOut])
def get_medication_logs(patient_id: int, limit: int = 20, db: Session = Depends(get_db)):
    return db.query(MedicationLog).filter(
        MedicationLog.patient_id == patient_id
    ).order_by(MedicationLog.scheduled_at.desc()).limit(limit).all()


@router.get("/{patient_id}/medication-logs/calendar", response_model=List[MedicationLogCalendarItem])
def get_medication_logs_calendar(patient_id: int, db: Session = Depends(get_db)):
    logs = db.query(MedicationLog).filter(MedicationLog.patient_id == patient_id).all()
    calendar: dict = {}
    for log in logs:
        date_str = log.scheduled_at.strftime("%Y-%m-%d")
        if date_str not in calendar:
            calendar[date_str] = {"has_records": True, "has_missed": False}
        if log.status == MedicationStatus.missed:
            calendar[date_str]["has_missed"] = True

    return [
        MedicationLogCalendarItem(date=d, has_records=v["has_records"], has_missed=v["has_missed"])
        for d, v in sorted(calendar.items())
    ]


@router.post("/{patient_id}/medication-logs", response_model=MedicationLogOut, status_code=201)
def create_medication_log(
    patient_id: int, data: MedicationLogCreate, db: Session = Depends(get_db)
):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    log = MedicationLog(patient_id=patient_id, **data.model_dump())
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


# ─── Patient Procedures ─────────────────────────────────

@router.post(
    "/{patient_id}/procedures",
    response_model=ProcedureOut,
    status_code=201,
)
def add_procedure(
    patient_id: int,
    data: ProcedureCreate,
    db: Session = Depends(get_db),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if not patient:
        raise HTTPException(
            status_code=404,
            detail="환자를 찾을 수 없습니다.",
        )

    payload = data.model_dump(exclude={"patient_id"})

    if data.recovery_guide_id is not None:
        recovery_guide = (
            db.query(RecoveryGuide)
            .filter(
                RecoveryGuide.id == data.recovery_guide_id,
                RecoveryGuide.is_active == True,
            )
            .first()
        )

        if not recovery_guide:
            raise HTTPException(
                status_code=404,
                detail="선택한 회복 가이드를 찾을 수 없습니다.",
            )

        # 최초 등록 시 현재 회복 단계를 가이드의 첫 단계로 설정
        if not payload.get("recovery_stage") and recovery_guide.steps:
            payload["recovery_stage"] = recovery_guide.steps[0].time_stage

        if payload.get("recovery_progress") is None:
            payload["recovery_progress"] = 0.0

    proc = Procedure(
        patient_id=patient_id,
        **payload,
    )

    db.add(proc)
    db.commit()
    db.refresh(proc)

    return _build_procedure_out(proc)

@router.put(
    "/{patient_id}/procedures/{procedure_id}",
    response_model=ProcedureOut,
)
def update_patient_procedure(
    patient_id: int,
    procedure_id: int,
    data: ProcedureUpdate,
    db: Session = Depends(get_db),
):
    procedure = (
        db.query(Procedure)
        .filter(
            Procedure.id == procedure_id,
            Procedure.patient_id == patient_id,
        )
        .first()
    )

    if not procedure:
        return None, 0.0

    if (
        not procedure.recovery_guide
        or not procedure.recovery_guide.steps
    ):
        return (
            procedure.recovery_stage,
            procedure.recovery_progress or 0.0,
        )

    update_data = data.model_dump(exclude_unset=True)

    if "recovery_guide_id" in update_data:
        recovery_guide_id = update_data["recovery_guide_id"]

        if recovery_guide_id is not None:
            recovery_guide = (
                db.query(RecoveryGuide)
                .filter(
                    RecoveryGuide.id == recovery_guide_id,
                    RecoveryGuide.is_active == True,
                )
                .first()
            )

            if not recovery_guide:
                raise HTTPException(
                    status_code=404,
                    detail="선택한 회복 가이드를 찾을 수 없습니다.",
                )

            # 템플릿을 변경했을 때 현재 단계가 새 가이드에 없으면
            # 새 가이드의 첫 번째 단계로 초기화
            step_names = {
                step.time_stage
                for step in recovery_guide.steps
            }

            current_or_requested_stage = update_data.get(
                "recovery_stage",
                procedure.recovery_stage,
            )

            if (
                recovery_guide.steps
                and current_or_requested_stage not in step_names
            ):
                update_data["recovery_stage"] = (
                    recovery_guide.steps[0].time_stage
                )
                update_data["recovery_progress"] = 0.0

    for key, value in update_data.items():
        setattr(procedure, key, value)

    db.commit()
    db.refresh(procedure)

    return _build_procedure_out(procedure)
# ─── Staff Notes ────────────────────────────────────────

@router.get("/{patient_id}/notes", response_model=List[StaffNoteOut])
def get_notes(patient_id: int, db: Session = Depends(get_db)):
    return db.query(StaffNote).filter(
        StaffNote.patient_id == patient_id
    ).order_by(StaffNote.created_at.desc()).all()


@router.post("/{patient_id}/notes", response_model=StaffNoteOut, status_code=201)
def create_note(patient_id: int, data: StaffNoteCreate, db: Session = Depends(get_db)):
    patient = db.query(Patient).filter(Patient.id == patient_id).first()
    if not patient:
        raise HTTPException(status_code=404, detail="환자를 찾을 수 없습니다.")
    note = StaffNote(patient_id=patient_id, content=data.content)
    db.add(note)
    db.commit()
    db.refresh(note)
    return note

@router.put(
    "/{patient_id}/notes/{note_id}",
    response_model=StaffNoteOut,
)
def update_note(
    patient_id: int,
    note_id: int,
    data: StaffNoteUpdate,
    db: Session = Depends(get_db),
):
    note = (
        db.query(StaffNote)
        .filter(
            StaffNote.id == note_id,
            StaffNote.patient_id == patient_id,
        )
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="노트를 찾을 수 없습니다.",
        )

    content = data.content.strip()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="노트 내용을 입력해주세요.",
        )

    note.content = content
    note.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(note)

    return note

@router.delete(
    "/{patient_id}/notes/{note_id}",
    status_code=204,
)
def delete_note(
    patient_id: int,
    note_id: int,
    db: Session = Depends(get_db),
):
    note = (
        db.query(StaffNote)
        .filter(
            StaffNote.id == note_id,
            StaffNote.patient_id == patient_id,
        )
        .first()
    )

    if not note:
        raise HTTPException(
            status_code=404,
            detail="노트를 찾을 수 없습니다.",
        )

    db.delete(note)
    db.commit()