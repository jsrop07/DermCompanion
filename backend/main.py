import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from database import engine, Base
from models import models  # noqa: F401 - 모델 등록을 위해 import

# 개발 단계: 자동 테이블 생성
Base.metadata.create_all(bind=engine)

from routers import auth, dashboard, patients, medications, recovery_guides, clinic, alerts, procedures

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
app.include_router(auth.router, prefix=api_prefix)
app.include_router(dashboard.router, prefix=api_prefix)
app.include_router(patients.router, prefix=api_prefix)
app.include_router(medications.router, prefix=api_prefix)
app.include_router(recovery_guides.router, prefix=api_prefix)
app.include_router(clinic.router, prefix=api_prefix)
app.include_router(alerts.router, prefix=api_prefix)
app.include_router(procedures.router, prefix=api_prefix)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "DermCompanion API"}


@app.get("/")
def root():
    return {"message": "DermCompanion API is running. Visit /docs for API documentation."}
