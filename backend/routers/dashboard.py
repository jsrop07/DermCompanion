from datetime import datetime, date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.models import (
    Alert,
    MedicationLog,
    MedicationStatus,
    Patient,
)
from routers.patients import (
    _calculate_recovery_state,
    _clinic_now,
    _med_status,
    _sync_missed_medication_logs,
)
from schemas.schemas import DashboardSummary, DashboardAlert, PatientListItem, AlertOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get(
    "/summary",
    response_model=DashboardSummary,
)
def get_dashboard_summary(
    db: Session = Depends(get_db),
):
    today = _clinic_now().date()

    patients = (
        db.query(Patient)
        .all()
    )

    today_patients = sum(
        1
        for patient in patients
        if patient.created_at.date()
        == today
    )

    active_recovery_count = 0
    delayed_count = 0
    missed_count = 0

    for patient in patients:
        _sync_missed_medication_logs(
            patient.id,
            db,
        )

        procedure = (
            patient.procedures[-1]
            if patient.procedures
            else None
        )

        if procedure:
            _, recovery_progress = (
                _calculate_recovery_state(
                    procedure
                )
            )

            if recovery_progress < 100:
                active_recovery_count += 1

        medication_status = (
            _med_status(patient, db)
        )

        if medication_status == "누락":
            missed_count += 1
        elif medication_status == "지연":
            delayed_count += 1

    return DashboardSummary(
        today_patients=today_patients,
        active_recovery_patients=active_recovery_count,
        delayed_medication_patients=delayed_count,
        missed_medication_patients=missed_count,
    )

@router.get(
    "/recent-patients",
    response_model=List[PatientListItem],
)
def get_recent_patients(
    limit: int = 5,
    db: Session = Depends(get_db),
):
    patients = (
        db.query(Patient)
        .order_by(
            Patient.created_at.desc()
        )
        .limit(limit)
        .all()
    )

    result = []

    for patient in patients:
        procedure = (
            patient.procedures[-1]
            if patient.procedures
            else None
        )

        medication_status = (
            _med_status(patient, db)
        )

        recovery_stage = None
        recovery_progress = 0.0

        if procedure:
            (
                recovery_stage,
                recovery_progress,
            ) = _calculate_recovery_state(
                procedure
            )

        diff = (
            datetime.utcnow()
            - patient.updated_at
        )

        if (
            diff.days == 0
            and diff.seconds < 3600
        ):
            last_update = (
                f"{max(1, diff.seconds // 60)}분 전"
            )
        elif diff.days == 0:
            last_update = (
                f"{diff.seconds // 3600}시간 전"
            )
        else:
            last_update = (
                f"{diff.days}일 전"
            )

        result.append(
            PatientListItem(
                id=patient.id,
                name=patient.name,
                procedure=(
                    procedure.procedure_name
                    if procedure
                    else None
                ),
                date=(
                    str(procedure.procedure_date)
                    if procedure
                    else None
                ),
                stage=(
                    "회복 완료"
                    if (
                        procedure
                        and recovery_progress
                        >= 100
                    )
                    else recovery_stage
                ),
                medicationStatus=(
                    medication_status
                ),
                lastUpdate=last_update,
                createdAt=str(
                    patient.created_at.date()
                ),
            )
        )

    return result

@router.get("/alerts", response_model=List[DashboardAlert])
def get_dashboard_alerts(limit: int = 5, db: Session = Depends(get_db)):
    alerts = db.query(Alert).filter(Alert.is_read == False).order_by(
        Alert.created_at.desc()
    ).limit(limit).all()

    result = []
    for a in alerts:
        diff = datetime.utcnow() - a.created_at
        if diff.seconds < 3600:
            time_str = f"{max(1, diff.seconds // 60)}분 전"
        elif diff.days == 0:
            time_str = f"{diff.seconds // 3600}시간 전"
        else:
            time_str = f"{diff.days}일 전"

        patient_name = a.patient.name if a.patient else "알 수 없음"
        result.append(DashboardAlert(
            id=a.id,
            type=a.type,
            patient=patient_name,
            message=a.message,
            time=time_str,
        ))
    return result
