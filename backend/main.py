import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from models import models  # noqa: F401 - 모델 등록을 위해 import

# 개발 단계: 자동 테이블 생성
Base.metadata.create_all(bind=engine)

from routers import (
    auth,
    dashboard,
    patients,
    medications,
    recovery_guides,
    clinic,
    alerts,
    procedures,
    patient_app,
)

from time_utils import (
    clinic_now,
    clinic_today,
)


app = FastAPI(
    title="DermCompanion API",
    description="피부과 시술 후 환자 케어 및 회복 관리 시스템",
    version="1.0.0",
)

# CORS 설정
frontend_origin = os.getenv("FRONTEND_ORIGIN", "http://localhost:5174")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
api_prefix = "/api"
# 로그인 API는 인증 없이 접근 가능
app.include_router(
    auth.router,
    prefix=api_prefix,
)

# 모바일 환자 앱 API
# 로그인은 공개되어 있고,
# 나머지 API는 각 엔드포인트에서 환자 JWT를 검사합니다.
app.include_router(
    patient_app.router,
    prefix=api_prefix,
)

# 아래 API는 로그인한 사용자만 접근 가능
protected_dependencies = [
    Depends(auth.get_current_user)
]

app.include_router(
    dashboard.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    patients.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    medications.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    recovery_guides.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    clinic.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    alerts.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)

app.include_router(
    procedures.router,
    prefix=api_prefix,
    dependencies=protected_dependencies,
)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "DermCompanion API"}


@app.get("/")
def root():
    return {"message": "DermCompanion API is running. Visit /docs for API documentation."}

@app.get("/api/time-check")
def time_check():
    return {
        "clinic_timezone": os.getenv(
            "CLINIC_TIMEZONE",
            "America/Chicago",
        ),
        "clinic_now": clinic_now(),
        "clinic_today": clinic_today(),
    }