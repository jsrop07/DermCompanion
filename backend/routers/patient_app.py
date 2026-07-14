import re
from typing import Optional
from time_utils import (
    clinic_now,
    clinic_today,
)
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session
from datetime import datetime, time, timedelta
from database import get_db
from models.models import (
    Patient,
    PatientMedication,
    MedicationLog,
    MedicationStatus,
    Procedure,
)
from routers.auth import (
    SECRET_KEY,
    ALGORITHM,
    create_access_token,
)
from routers.patients import (
    MEDICATION_MISSED_GRACE_MINUTES,
    _calculate_recovery_state,
    clinic_now,
    _sync_missed_medication_logs,
)
from schemas.schemas import (
    PatientAppLoginRequest,
    PatientAppLoginResponse,
    PatientAppPatientOut,
    PatientAppMedicationOut,
    PatientAppRecoveryOut,
    PatientAppRecoveryStepOut,
    PatientAppMedicationScheduleOut,
    PatientAppMedicationCompleteRequest,
    MedicationLogOut,
)

router = APIRouter(
    prefix="/patient-app",
    tags=["patient-app"],
)

patient_oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/patient-app/login",
)


def normalize_phone(phone: str) -> str:
    """
    010-1234-5678과 01012345678을 같은 번호로 비교합니다.
    """
    return re.sub(r"\D", "", phone)


def get_current_patient(
    token: str = Depends(patient_oauth2_scheme),
    db: Session = Depends(get_db),
) -> Patient:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="환자 인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        token_type = payload.get("type")
        patient_id = payload.get("sub")

        if token_type != "patient" or patient_id is None:
            raise credentials_exception

        patient_id_int = int(patient_id)

    except (JWTError, ValueError):
        raise credentials_exception

    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id_int)
        .first()
    )

    if not patient:
        raise credentials_exception

    return patient


@router.post(
    "/login",
    response_model=PatientAppLoginResponse,
)
def patient_login(
    request: PatientAppLoginRequest,
    db: Session = Depends(get_db),
):
    normalized_input_phone = normalize_phone(
        request.phone,
    )

    candidates = (
        db.query(Patient)
        .filter(
            Patient.birthdate == request.birthdate,
        )
        .all()
    )

    patient: Optional[Patient] = next(
        (
            candidate
            for candidate in candidates
            if normalize_phone(candidate.phone)
            == normalized_input_phone
        ),
        None,
    )

    if not patient:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=(
                "전화번호 또는 생년월일이 올바르지 않습니다."
            ),
        )

    token = create_access_token(
        {
            "sub": str(patient.id),
            "type": "patient",
        }
    )

    return PatientAppLoginResponse(
        access_token=token,
        patient=PatientAppPatientOut.model_validate(
            patient
        ),
    )


@router.get(
    "/me",
    response_model=PatientAppPatientOut,
)
def get_patient_profile(
    current_patient: Patient = Depends(
        get_current_patient
    ),
):
    return current_patient


@router.get(
    "/medications",
    response_model=list[PatientAppMedicationOut],
)
def get_patient_app_medications(
    current_patient: Patient = Depends(
        get_current_patient
    ),
    db: Session = Depends(get_db),
):
    return (
        db.query(PatientMedication)
        .filter(
            PatientMedication.patient_id
            == current_patient.id,
            PatientMedication.is_active == True,
        )
        .order_by(
            PatientMedication.created_at.desc(),
        )
        .all()
    )

@router.get(
    "/medication-schedules/today",
    response_model=list[
        PatientAppMedicationScheduleOut
    ],
)
def get_today_medication_schedules(
    current_patient: Patient = Depends(
        get_current_patient
    ),
    db: Session = Depends(get_db),
):
    _sync_missed_medication_logs(
        current_patient.id,
        db,
    )
    medications = (
        db.query(PatientMedication)
        .filter(
            PatientMedication.patient_id
            == current_patient.id,
            PatientMedication.is_active == True,
        )
        .order_by(
            PatientMedication.created_at.asc(),
        )
        .all()
    )

    today = clinic_today()
    result = []


    for medication in medications:
        start_date = (
            medication.schedule_start_date
            or medication.created_at.date()
        )

        interval_days = max(
            medication.interval_days or 1,
            1,
        )

        days_difference = (
            today - start_date
        ).days

        is_medication_day = (
            days_difference >= 0
            and days_difference
            % interval_days == 0
        )

        if not is_medication_day:
            continue

        schedule_times = (
            medication.schedule_times or []
        )

        for schedule_time in schedule_times:
            try:
                hour_text, minute_text = (
                    schedule_time.split(":")
                )

                scheduled_at = datetime.combine(
                    today,
                    time(
                        hour=int(hour_text),
                        minute=int(minute_text),
                    ),
                )
            except (
                ValueError,
                AttributeError,
            ):
                continue

            existing_log = (
                db.query(MedicationLog)
                .filter(
                    MedicationLog.patient_id
                    == current_patient.id,
                    MedicationLog.patient_medication_id
                    == medication.id,
                    MedicationLog.scheduled_at
                    == scheduled_at,
                )
                .first()
            )

            result.append(
                PatientAppMedicationScheduleOut(
                    medication_id=medication.id,
                    medication_name=(
                        medication.medication_name
                    ),
                    dosage=medication.dosage,
                    purpose=medication.purpose,
                    scheduled_time=schedule_time,
                    scheduled_at=scheduled_at,
                    status=(
                        existing_log.status.value
                        if existing_log
                        else None
                    ),
                    completed=(
                        existing_log is not None
                        and existing_log.status
                        in (
                            MedicationStatus.completed,
                            MedicationStatus.late_completed,
                        )
                    ),
                    completed_at=(
                        existing_log.completed_at
                        if existing_log
                        else None
                    ),
                    completed_log_id=(
                        existing_log.id
                        if existing_log
                        else None
                    ),
                )
            )
    return sorted(
        result,
        key=lambda item: item.scheduled_at,
    )

@router.post(
    "/medications/{medication_id}/complete",
    response_model=MedicationLogOut,
)
def complete_medication(
    medication_id: int,
    request: PatientAppMedicationCompleteRequest,
    current_patient: Patient = Depends(
        get_current_patient
    ),
    db: Session = Depends(get_db),
):
    medication = (
        db.query(PatientMedication)
        .filter(
            PatientMedication.id
            == medication_id,
            PatientMedication.patient_id
            == current_patient.id,
            PatientMedication.is_active
            == True,
        )
        .first()
    )

    if not medication:
        raise HTTPException(
            status_code=404,
            detail="복약 정보를 찾을 수 없습니다.",
        )

    scheduled_at = request.scheduled_at
    completed_at = clinic_now()

    deadline = (
        scheduled_at
        + timedelta(
            minutes=(
                MEDICATION_MISSED_GRACE_MINUTES
            )
        )
    )

    new_status = (
        MedicationStatus.completed
        if completed_at <= deadline
        else MedicationStatus.late_completed
    )

    existing_log = (
        db.query(MedicationLog)
        .filter(
            MedicationLog.patient_id
            == current_patient.id,
            MedicationLog.patient_medication_id
            == medication.id,
            MedicationLog.scheduled_at
            == scheduled_at,
        )
        .first()
    )

    if existing_log:
        if existing_log.status in (
            MedicationStatus.completed,
            MedicationStatus.late_completed,
        ):
            return existing_log

        existing_log.status = new_status
        existing_log.completed_at = (
            completed_at
        )

        db.commit()
        db.refresh(existing_log)

        return existing_log

    log = MedicationLog(
        patient_id=current_patient.id,
        patient_medication_id=medication.id,
        medication_name=(
            medication.medication_name
        ),
        scheduled_at=scheduled_at,
        status=new_status,
        completed_at=completed_at,
    )

    db.add(log)
    db.commit()
    db.refresh(log)

    return log

@router.get(
    "/recovery",
    response_model=PatientAppRecoveryOut,
)
def get_patient_app_recovery(
    current_patient: Patient = Depends(
        get_current_patient
    ),
    db: Session = Depends(get_db),
):
    procedure = (
        db.query(Procedure)
        .filter(
            Procedure.patient_id
            == current_patient.id
        )
        .order_by(
            Procedure.procedure_date.desc(),
            Procedure.procedure_time.desc(),
            Procedure.id.desc(),
        )
        .first()
    )

    if not procedure:
        return PatientAppRecoveryOut()

    recovery_stage, recovery_progress = (
        _calculate_recovery_state(procedure)
    )

    current_step = None
    next_step = None

    if (
        procedure.recovery_guide
        and procedure.recovery_guide.steps
    ):
        steps = sorted(
            [
                step
                for step
                in procedure.recovery_guide.steps
                if step.offset_minutes is not None
            ],
            key=lambda step: (
                step.offset_minutes,
                step.sort_order or 0,
                step.id,
            ),
        )

        if steps:
            from datetime import datetime, time

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
                    clinic_now() - started_at
                ).total_seconds() / 60,
            )

            current_step_model = steps[0]

            for index, step in enumerate(steps):
                if elapsed_minutes >= step.offset_minutes:
                    current_step_model = step
                else:
                    next_step = (
                        PatientAppRecoveryStepOut(
                            id=step.id,
                            time_stage=step.time_stage,
                            offset_minutes=step.offset_minutes,
                            title=step.title,
                            precautions=step.precautions,
                            recommendations=step.recommendations,
                            warning_symptoms=(
                                step.warning_symptoms
                            ),
                        )
                    )
                    break

            current_step = PatientAppRecoveryStepOut(
                id=current_step_model.id,
                time_stage=(
                    current_step_model.time_stage
                ),
                offset_minutes=(
                    current_step_model.offset_minutes
                ),
                title=current_step_model.title,
                precautions=(
                    current_step_model.precautions
                ),
                recommendations=(
                    current_step_model.recommendations
                ),
                warning_symptoms=(
                    current_step_model.warning_symptoms
                ),
            )

    return PatientAppRecoveryOut(
        procedure_name=procedure.procedure_name,
        procedure_date=procedure.procedure_date,
        procedure_time=procedure.procedure_time,
        recovery_stage=recovery_stage,
        recovery_progress=recovery_progress,
        current_step=current_step,
        next_step=next_step,
    )