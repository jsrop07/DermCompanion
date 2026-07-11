# DermCompanion — 피부과 시술 후 환자 케어 및 회복 관리 시스템

## 프로젝트 개요

DermCompanion은 피부과 클리닉 관리자가 사용하는 웹 기반 환자 관리 시스템입니다.  
환자 정보, 시술 기록, 복약 추적, 회복 가이드 관리 등의 기능을 제공합니다.

| 구분 | 기술 스택 |
|------|---------|
| 프론트엔드 | React 18 + TypeScript + Vite + TailwindCSS v4 |
| 백엔드 | FastAPI + SQLAlchemy |
| 데이터베이스 | MariaDB |
| 인증 | JWT (python-jose) |

---

## 프로젝트 구조

```
derm/
├── src/                        # 프론트엔드 소스
│   ├── api/                    # API 클라이언트 모듈
│   │   ├── client.ts           # Fetch 기반 API 클라이언트
│   │   ├── authApi.ts
│   │   ├── dashboardApi.ts
│   │   ├── patientApi.ts
│   │   ├── medicationApi.ts
│   │   ├── recoveryGuideApi.ts
│   │   └── clinicApi.ts
│   ├── types/                  # TypeScript 타입 정의
│   └── app/
│       ├── pages/              # 페이지 컴포넌트
│       └── components/         # 공통 컴포넌트
├── backend/
│   ├── derm_venv/              # Python 가상환경 (git 제외)
│   ├── models/models.py        # SQLAlchemy ORM 모델
│   ├── schemas/schemas.py      # Pydantic 스키마
│   ├── routers/                # FastAPI 라우터
│   │   ├── auth.py
│   │   ├── dashboard.py
│   │   ├── patients.py
│   │   ├── medications.py
│   │   ├── recovery_guides.py
│   │   ├── clinic.py
│   │   └── alerts.py
│   ├── seed/seed_data.py       # 개발용 Seed 데이터
│   ├── database.py
│   ├── main.py
│   ├── .env                    # 환경변수 (직접 수정)
│   ├── .env.example
│   └── requirements.txt
└── .env                        # 프론트 환경변수
```

---

## 1. MariaDB 데이터베이스 생성

```sql
CREATE DATABASE dermcompanion
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
```

---

## 2. 백엔드 실행

### Windows (PowerShell)

```powershell
# 프로젝트 루트에서
cd backend

# 가상환경 생성 (최초 1회)
python -m venv derm_venv

# 가상환경 활성화
.\derm_venv\Scripts\Activate.ps1
# 또는 (Git Bash에서)
# source derm_venv/Scripts/activate

# 패키지 설치 (최초 1회)
pip install -r requirements.txt

# .env 파일 수정
# DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/dermcompanion

# 서버 실행 (PowerShell)
$env:PYTHONUTF8=1
uvicorn main:app --reload --port 8000
```

> **API 문서:** http://localhost:8000/docs

---

## 3. Seed 데이터 실행

```powershell
cd backend
.\derm_venv\Scripts\Activate.ps1
python seed/seed_data.py
```

생성되는 데이터:
- 관리자 계정: `admin@dermcompanion.kr` / `admin1234!`
- 샘플 환자 8명
- 클리닉 정보
- 약물 마스터 6개
- 회복 가이드 3개 (레이저, 주사, 집중치료)
- 복약 기록 및 알림

---

## 4. 프론트엔드 실행

```powershell
# 프로젝트 루트에서
npm install   # 최초 1회
npm run dev   # http://localhost:5173
```

### .env 설정 (루트)
```
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## 5. 연동 확인

1. MariaDB 실행 및 DB 생성
2. `backend/.env` 수정 (DB 비밀번호)
3. 백엔드 실행: `uvicorn main:app --reload --port 8000`
4. seed 실행: `python seed/seed_data.py`
5. 프론트 실행: `npm run dev`
6. http://localhost:5173/login 접속
7. `admin@dermcompanion.kr` / `admin1234!` 로 로그인

---

## 6. API 목록

| Method | Path | 설명 |
|--------|------|------|
| GET | `/api/health` | 헬스 체크 |
| POST | `/api/auth/login` | 로그인 |
| GET | `/api/dashboard/summary` | 대시보드 통계 |
| GET | `/api/dashboard/recent-patients` | 최근 환자 |
| GET | `/api/dashboard/alerts` | 알림 |
| GET/POST | `/api/patients` | 환자 목록/등록 |
| GET/PUT/DELETE | `/api/patients/{id}` | 환자 상세/수정/삭제 |
| GET/POST | `/api/patients/{id}/medications` | 복약 정보 |
| GET/POST | `/api/patients/{id}/medication-logs` | 복약 기록 |
| GET | `/api/patients/{id}/medication-logs/calendar` | 복약 달력 |
| GET/POST | `/api/medications` | 약물 마스터 |
| GET/POST/PUT/DELETE | `/api/recovery-guides` | 회복 가이드 |
| GET/POST/PUT | `/api/recovery-guides/{id}/steps` | 회복 가이드 단계 |
| GET/PUT | `/api/clinic` | 클리닉 정보 |
| GET/POST | `/api/patients/{id}/notes` | 스태프 노트 |
| GET | `/api/alerts` | 알림 목록 |
| PUT | `/api/alerts/{id}/read` | 알림 읽음 처리 |

---

## 7. PowerShell 실행 권한 오류 시

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
