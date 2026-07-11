from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import MedicationMaster
from schemas.schemas import MedicationMasterCreate, MedicationMasterOut

router = APIRouter(prefix="/medications", tags=["medications"])


@router.get("", response_model=List[MedicationMasterOut])
def list_medications(db: Session = Depends(get_db)):
    return db.query(MedicationMaster).filter(MedicationMaster.is_active == True).all()


@router.post("", response_model=MedicationMasterOut, status_code=201)
def create_medication(data: MedicationMasterCreate, db: Session = Depends(get_db)):
    med = MedicationMaster(**data.model_dump())
    db.add(med)
    db.commit()
    db.refresh(med)
    return med


@router.put("/{medication_id}", response_model=MedicationMasterOut)
def update_medication(medication_id: int, data: MedicationMasterCreate, db: Session = Depends(get_db)):
    med = db.query(MedicationMaster).filter(MedicationMaster.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")
    for key, value in data.model_dump().items():
        setattr(med, key, value)
    db.commit()
    db.refresh(med)
    return med


@router.delete("/{medication_id}", status_code=204)
def delete_medication(medication_id: int, db: Session = Depends(get_db)):
    med = db.query(MedicationMaster).filter(MedicationMaster.id == medication_id).first()
    if not med:
        raise HTTPException(status_code=404, detail="약물을 찾을 수 없습니다.")
    med.is_active = False
    db.commit()
