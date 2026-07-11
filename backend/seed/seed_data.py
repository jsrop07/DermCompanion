# -*- coding: utf-8 -*-
"""
DermCompanion Seed Data
실행 방법:
  cd backend
  derm_venv\\Scripts\\activate
  python seed/seed_data.py
"""
import sys
import os
from datetime import datetime, date, timedelta

# 프로젝트 루트를 path에 추가
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv()

from database import SessionLocal, engine, Base
from models.models import (
    User, Patient, Procedure, MedicationMaster, PatientMedication,
    MedicationLog, RecoveryGuide, RecoveryGuideStep, ClinicInfo, Alert, StaffNote,
    MedicationStatus, AlertType,
)
import bcrypt as _bcrypt


def hash_password(password: str) -> str:
    return _bcrypt.hashpw(password.encode("utf-8"), _bcrypt.gensalt()).decode("utf-8")


def seed():
    # 테이블 생성
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 이미 데이터가 있으면 스킵
        if db.query(User).count() > 0:
            print("[SKIP] 이미 seed 데이터가 존재합니다. 건너뜁니다.")
            return

        print("[START] Seed 데이터 생성 시작...")

        # 1. 관리자 계정
        admin = User(
            email="admin@dermcompanion.kr",
            password_hash=hash_password("admin1234!"),
            name="클리닉 관리자",
            role="admin",
        )
        db.add(admin)
        db.flush()
        print(f"  [OK] 관리자 계정 생성: {admin.email}")

        # 2. 클리닉 정보
        clinic = ClinicInfo(
            name="더마 클리닉",
            phone="02-1234-5678",
            email="info@dermaclinic.kr",
            address="서울특별시 강남구 테헤란로 123",
            detail_address="더마빌딩 3층",
            weekday_hours="09:00 - 18:00",
            saturday_hours="09:00 - 14:00",
            closed_days="일요일, 공휴일",
            lunch_hours="12:30 - 13:30",
            notice="시술 후 관리는 회복에 매우 중요합니다. 담당 의료진의 지시사항을 잘 따라주시기 바랍니다.",
        )
        db.add(clinic)
        print("  [OK] 클리닉 정보 생성")

        # 3. 약물 마스터
        medications_master = [
            MedicationMaster(name="항생제 (세파클러)", default_dosage="500mg", default_frequency="daily-2", purpose="감염 예방"),
            MedicationMaster(name="소염제 (이부프로펜)", default_dosage="200mg", default_frequency="daily-3", purpose="염증 완화"),
            MedicationMaster(name="진통제 (아세트아미노펜)", default_dosage="250mg", default_frequency="as-needed", purpose="통증 완화"),
            MedicationMaster(name="항히스타민제", default_dosage="10mg", default_frequency="daily-1", purpose="알레르기 예방"),
            MedicationMaster(name="비타민 C", default_dosage="1000mg", default_frequency="daily-1", purpose="회복 촉진"),
            MedicationMaster(name="스테로이드 연고", default_dosage="적당량", default_frequency="daily-2", purpose="염증 및 부기 완화"),
        ]
        for m in medications_master:
            db.add(m)
        print(f"  [OK] 약물 마스터 {len(medications_master)}개 생성")

        # 4. 회복 가이드
        guide1 = RecoveryGuide(name="표준 레이저 회복", procedure_type="laser")
        guide2 = RecoveryGuide(name="보톡스/필러 회복", procedure_type="injection")
        guide3 = RecoveryGuide(name="집중 치료 회복", procedure_type="intensive")
        db.add_all([guide1, guide2, guide3])
        db.flush()

        laser_steps = [
            RecoveryGuideStep(guide_id=guide1.id, time_stage="3h", title="즉시 케어", sort_order=1,
                precautions="- 냉찜질을 20분간 실시하세요\n- 처방받은 약을 복용하세요\n- 시술 부위를 만지지 마세요",
                recommendations="- 충분한 수분을 섭취하세요\n- 안정을 취하세요",
                warning_symptoms="- 심한 부기나 발적\n- 지속적인 통증"),
            RecoveryGuideStep(guide_id=guide1.id, time_stage="12h", title="초기 회복", sort_order=2,
                precautions="- 부기를 주의 깊게 관찰하세요\n- 세안을 피하세요\n- 자외선 차단에 유의하세요",
                recommendations="- 충분한 수분을 섭취하세요\n- 숙면을 취하세요",
                warning_symptoms="- 심한 부기나 발적\n- 이상 분비물"),
            RecoveryGuideStep(guide_id=guide1.id, time_stage="24h", title="1일차", sort_order=3,
                precautions="- 가벼운 세안 가능\n- 보습 관리 철저히",
                recommendations="- 균형 잡힌 식사\n- 자외선 차단제 필수"),
            RecoveryGuideStep(guide_id=guide1.id, time_stage="48h", title="2일차", sort_order=4,
                precautions="- 메이크업 가능\n- 정상 생활 가능",
                recommendations="- 보습 지속\n- 자극적인 화장품 피하기"),
            RecoveryGuideStep(guide_id=guide1.id, time_stage="7d", title="1주차 검진", sort_order=5,
                precautions="- 클리닉 방문\n- 경과 확인",
                recommendations="- 일상적인 스킨케어 재개"),
        ]
        for step in laser_steps:
            db.add(step)
        print("  [OK] 회복 가이드 3개 + 단계 5개 생성")

        # 5. 샘플 환자
        today = date.today()
        patients_data = [
            dict(name="김미영", phone="010-1234-5678", birthdate=date(1990, 5, 15)),
            dict(name="이서준", phone="010-2345-6789", birthdate=date(1988, 3, 22)),
            dict(name="박지원", phone="010-3456-7890", birthdate=date(1995, 8, 10)),
            dict(name="최수민", phone="010-4567-8901", birthdate=date(1992, 11, 30)),
            dict(name="정하늘", phone="010-5678-9012", birthdate=date(1987, 2, 14)),
            dict(name="강민지", phone="010-6789-0123", birthdate=date(1993, 7, 7)),
            dict(name="윤서아", phone="010-7890-1234", birthdate=date(1991, 4, 25)),
            dict(name="조은우", phone="010-8901-2345", birthdate=date(1996, 9, 18)),
        ]

        patient_procedures = [
            dict(procedure_name="레이저 토닝", days_ago=7, recovery_stage="12시간", progress=15),
            dict(procedure_name="보톡스", days_ago=8, recovery_stage="48시간", progress=30),
            dict(procedure_name="필러", days_ago=9, recovery_stage="72시간", progress=45),
            dict(procedure_name="PDT 치료", days_ago=7, recovery_stage="3시간", progress=5),
            dict(procedure_name="프락셀 레이저", days_ago=10, recovery_stage="7일", progress=60),
            dict(procedure_name="리프팅", days_ago=11, recovery_stage="5일", progress=50),
            dict(procedure_name="레이저 토닝", days_ago=12, recovery_stage="5일", progress=50),
            dict(procedure_name="필러", days_ago=7, recovery_stage="6시간", progress=8),
        ]

        minutes_ago = [30, 60, 120, 15, 180, 300, 1440, 45]
        patients = []
        for i, (pd, pp) in enumerate(zip(patients_data, patient_procedures)):
            patient = Patient(**pd)
            patient.created_at = datetime.utcnow() - timedelta(days=pp["days_ago"])
            patient.updated_at = datetime.utcnow() - timedelta(minutes=minutes_ago[i])
            db.add(patient)
            db.flush()
            patients.append(patient)

            proc = Procedure(
                patient_id=patient.id,
                procedure_name=pp["procedure_name"],
                procedure_date=today - timedelta(days=pp["days_ago"]),
                recovery_stage=pp["recovery_stage"],
                recovery_progress=pp["progress"],
                recovery_guide_id=guide1.id,
            )
            db.add(proc)

        db.flush()
        print(f"  [OK] 환자 {len(patients)}명 생성")

        # 6. 환자 복약 정보
        for patient in patients[:3]:
            meds = [
                PatientMedication(patient_id=patient.id, medication_name="항생제", dosage="500mg", frequency="daily-2", purpose="감염 예방", adherence=95),
                PatientMedication(patient_id=patient.id, medication_name="진통제", dosage="250mg", frequency="as-needed", purpose="통증 완화", adherence=100),
                PatientMedication(patient_id=patient.id, medication_name="소염제", dosage="200mg", frequency="daily-3", purpose="염증 감소", adherence=88),
            ]
            for m in meds:
                db.add(m)
        db.flush()

        # 7. 복약 기록
        patient1 = patients[0]
        base_time = datetime.utcnow() - timedelta(days=3)
        log_data = [
            ("항생제", 0, "completed"), ("소염제", 4, "completed"),
            ("항생제", 9, "completed"), ("소염제", 12, "missed"),
            ("항생제", 24, "completed"), ("소염제", 28, "completed"),
            ("항생제", 33, "completed"), ("소염제", 36, "completed"),
            ("항생제", 48, "completed"), ("소염제", 52, "missed"),
            ("항생제", 57, "completed"),
        ]
        for med_name, hours_offset, status_val in log_data:
            log = MedicationLog(
                patient_id=patient1.id,
                medication_name=med_name,
                scheduled_at=base_time + timedelta(hours=hours_offset),
                status=MedicationStatus.completed if status_val == "completed" else MedicationStatus.missed,
            )
            db.add(log)
        print("  [OK] 복약 기록 11건 생성")

        # 8. 알림
        alerts_data = [
            Alert(type=AlertType.medication, patient_id=patients[2].id, message="어제 저녁 복약 기록 누락",
                  created_at=datetime.utcnow() - timedelta(hours=2)),
            Alert(type=AlertType.medication, patient_id=patients[1].id, message="오늘 아침 복약 기록 누락",
                  created_at=datetime.utcnow() - timedelta(hours=3)),
            Alert(type=AlertType.recovery, patient_id=patients[6].id, message="회복 단계 업데이트 필요",
                  created_at=datetime.utcnow() - timedelta(hours=4)),
        ]
        for a in alerts_data:
            db.add(a)
        print("  [OK] 알림 3건 생성")

        # 9. 내부 노트
        note = StaffNote(
            patient_id=patients[0].id,
            content="초기 시술 순조롭게 진행됨. 부기는 정상 범위 내.",
            created_by=admin.id,
        )
        db.add(note)

        db.commit()
        print("\n[DONE] Seed 데이터 생성 완료!")
        print("\n[LOGIN INFO]")
        print("  Email   : admin@dermcompanion.kr")
        print("  Password: admin1234!")

    except Exception as e:
        db.rollback()
        print(f"[ERROR] {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
