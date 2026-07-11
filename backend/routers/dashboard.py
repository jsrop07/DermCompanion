from datetime import datetime, date, timedelta
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from database import get_db
from models.models import Patient, Procedure, MedicationLog, Alert, MedicationStatus
from schemas.schemas import DashboardSummary, DashboardAlert, PatientListItem, AlertOut

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    today = date.today()
    today_patients = db.query(Patient).filter(
        func.date(Patient.created_at) == today
    ).count()

    active_recovery = db.query(Patient).count()

    # 최근 24시간 내 복약 누락이 있는 환자 수
    since = datetime.utcnow() - timedelta(hours=24)
    missed_patient_ids = db.query(MedicationLog.patient_id).filter(
        MedicationLog.status == MedicationStatus.missed,
        MedicationLog.scheduled_at >= since
    ).distinct().all()
    missed_count = len(missed_patient_ids)

    return DashboardSummary(
        today_patients=today_patients,
        active_recovery_patients=active_recovery,
        missed_medication_patients=missed_count,
    )


@router.get("/recent-patients", response_model=List[PatientListItem])
def get_recent_patients(limit: int = 5, db: Session = Depends(get_db)):
    patients = db.query(Patient).order_by(Patient.created_at.desc()).limit(limit).all()
    result = []
    for p in patients:
        proc = p.procedures[-1] if p.procedures else None

        # 복약 누락 여부
        since = datetime.utcnow() - timedelta(hours=24)
        missed = db.query(MedicationLog).filter(
            MedicationLog.patient_id == p.id,
            MedicationLog.status == MedicationStatus.missed,
            MedicationLog.scheduled_at >= since,
        ).first()
        med_status = "누락" if missed else "정상"

        # 마지막 업데이트 (상대 시간)
        diff = datetime.utcnow() - p.updated_at
        if diff.seconds < 3600:
            last_update = f"{diff.seconds // 60}분 전"
        elif diff.days == 0:
            last_update = f"{diff.seconds // 3600}시간 전"
        else:
            last_update = f"{diff.days}일 전"

        result.append(PatientListItem(
            id=p.id,
            name=p.name,
            procedure=proc.procedure_name if proc else None,
            date=str(proc.procedure_date) if proc else None,
            stage=proc.recovery_stage if proc else None,
            medicationStatus=med_status,
            lastUpdate=last_update,
        ))
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
