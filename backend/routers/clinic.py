from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import ClinicInfo
from schemas.schemas import ClinicInfoUpdate, ClinicInfoOut

router = APIRouter(prefix="/clinic", tags=["clinic"])


@router.get("", response_model=ClinicInfoOut)
def get_clinic(db: Session = Depends(get_db)):
    clinic = db.query(ClinicInfo).first()
    if not clinic:
        raise HTTPException(status_code=404, detail="클리닉 정보가 없습니다.")
    return clinic


@router.put("", response_model=ClinicInfoOut)
def update_clinic(data: ClinicInfoUpdate, db: Session = Depends(get_db)):
    clinic = db.query(ClinicInfo).first()
    if not clinic:
        clinic = ClinicInfo(**data.model_dump())
        db.add(clinic)
    else:
        for key, value in data.model_dump().items():
            setattr(clinic, key, value)
    db.commit()
    db.refresh(clinic)
    return clinic
