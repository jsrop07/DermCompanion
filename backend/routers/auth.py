import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from dotenv import load_dotenv
from sqlalchemy.orm import Session
import bcrypt as _bcrypt
from jose import JWTError,jwt

from database import get_db
from models.models import User
from schemas.schemas import LoginRequest, LoginResponse

load_dotenv()
router = APIRouter(prefix="/auth", tags=["auth"])

SECRET_KEY = os.getenv("SECRET_KEY")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)

if not SECRET_KEY:
    raise RuntimeError(
        "SECRET_KEY 환경변수가 설정되지 않았습니다."
    )

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "43200")
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return _bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="인증 정보가 유효하지 않습니다.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id_int = int(user_id)

    except (JWTError, ValueError):
        raise credentials_exception

    user = (
        db.query(User)
        .filter(User.id == user_id_int)
        .first()
    )

    if not user:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다.",
        )

    return user

def require_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    role_value = (
        current_user.role.value
        if hasattr(current_user.role, "value")
        else str(current_user.role)
    )

    if role_value != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="관리자 권한이 필요합니다.",
        )

    return current_user
    
@router.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="이메일 또는 비밀번호가 올바르지 않습니다.",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="비활성화된 계정입니다.",
        )
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role})
    return LoginResponse(access_token=token, user_name=user.name, user_role=user.role)
