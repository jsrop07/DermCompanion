from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Date,
    Time,
    Boolean,
    Float,
    ForeignKey,
    Enum,
    JSON,
)
from sqlalchemy.orm import relationship
from database import Base
import enum


class UserRole(str, enum.Enum):
    admin = "admin"
    staff = "staff"


class MedicationStatus(str, enum.Enum):
    completed = "completed"
    missed = "missed"
    late_completed = "late_completed"


class AlertType(str, enum.Enum):
    medication = "medication"
    recovery = "recovery"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.staff)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    notes = relationship("StaffNote", back_populates="author")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=False)
    birthdate = Column(Date, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    medication_status_override = Column(String(50), nullable=True)

    procedures = relationship("Procedure", back_populates="patient", cascade="all, delete-orphan")
    medications = relationship("PatientMedication", back_populates="patient", cascade="all, delete-orphan")
    medication_logs = relationship("MedicationLog", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient", cascade="all, delete-orphan")
    notes = relationship("StaffNote", back_populates="patient", cascade="all, delete-orphan")


class Procedure(Base):
    __tablename__ = "procedures"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    procedure_name = Column(String(200), nullable=False)
    procedure_date = Column(Date, nullable=False)
    procedure_time = Column(Time, nullable=True)
    notes = Column(Text, nullable=True)
    recovery_stage = Column(String(50), nullable=True)
    recovery_progress = Column(Float, default=0.0)
    recovery_guide_id = Column(Integer, ForeignKey("recovery_guides.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="procedures")
    recovery_guide = relationship("RecoveryGuide")

class ProcedureMaster(Base):
    __tablename__ = "procedure_masters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class MedicationMaster(Base):
    __tablename__ = "medication_masters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    default_dosage = Column(String(50), nullable=True)
    default_frequency = Column(String(50), nullable=True)
    purpose = Column(String(200), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class PatientMedication(Base):
    __tablename__ = "patient_medications"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
    )
    medication_name = Column(
        String(200),
        nullable=False,
    )
    dosage = Column(
        String(50),
        nullable=True,
    )
    frequency = Column(
        String(50),
        nullable=True,
    )

    interval_days = Column(
        Integer,
        nullable=False,
        default=1,
    )

    schedule_start_date = Column(
        Date,
        nullable=True,
    )

    schedule_times = Column(
        JSON,
        nullable=True,
        default=list,
    )

    purpose = Column(
        String(200),
        nullable=True,
    )
    adherence = Column(
        Float,
        default=100.0,
    )
    is_active = Column(
        Boolean,
        default=True,
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    patient = relationship(
        "Patient",
        back_populates="medications",
    )

    logs = relationship(
        "MedicationLog",
        back_populates="medication",
        cascade="all, delete-orphan",
    )

class MedicationLog(Base):
    __tablename__ = "medication_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )
    patient_id = Column(
        Integer,
        ForeignKey("patients.id"),
        nullable=False,
    )
    patient_medication_id = Column(
        Integer,
        ForeignKey("patient_medications.id"),
        nullable=True,
    )
    medication_name = Column(
        String(200),
        nullable=False,
    )
    scheduled_at = Column(
        DateTime,
        nullable=False,
    )
    status = Column(
        Enum(MedicationStatus),
        nullable=False,
    )
    completed_at = Column(
        DateTime,
        nullable=True,
    )
    created_at = Column(
        DateTime,
        default=datetime.utcnow,
    )

    patient = relationship(
        "Patient",
        back_populates="medication_logs",
    )
    medication = relationship(
        "PatientMedication",
        back_populates="logs",
    )


class RecoveryGuide(Base):
    __tablename__ = "recovery_guides"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    procedure_type = Column(String(50), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    steps = relationship(
        "RecoveryGuideStep",
        back_populates="guide",
        cascade="all, delete-orphan",
        order_by="RecoveryGuideStep.offset_minutes",
    )


class RecoveryGuideStep(Base):
    __tablename__ = "recovery_guide_steps"

    id = Column(Integer, primary_key=True, index=True)
    guide_id = Column(Integer, ForeignKey("recovery_guides.id"), nullable=False)
    time_stage = Column(String(50), nullable=False)
    offset_minutes = Column(Integer, nullable=False, default=0)
    title = Column(String(200), nullable=True)
    precautions = Column(Text, nullable=True)
    recommendations = Column(Text, nullable=True)
    warning_symptoms = Column(Text, nullable=True)
    sort_order = Column(Integer, default=0)

    guide = relationship("RecoveryGuide", back_populates="steps")


class ClinicInfo(Base):
    __tablename__ = "clinic_info"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(20), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    detail_address = Column(String(200), nullable=True)
    weekday_hours = Column(String(50), nullable=True)
    saturday_hours = Column(String(50), nullable=True)
    closed_days = Column(String(100), nullable=True)
    lunch_hours = Column(String(50), nullable=True)
    notice = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Alert(Base):
    __tablename__ = "alerts"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(AlertType), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=True)
    message = Column(String(500), nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    patient = relationship("Patient", back_populates="alerts")


class StaffNote(Base):
    __tablename__ = "staff_notes"

    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="notes")
    author = relationship("User", back_populates="notes")
