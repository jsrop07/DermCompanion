from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import ProcedureMaster
from schemas.schemas import ProcedureMasterCreate, ProcedureMasterOut

router = APIRouter(prefix="/procedures", tags=["procedures"])

@router.get("", response_model=List[ProcedureMasterOut])
def get_procedures(db: Session = Depends(get_db)):
    return db.query(ProcedureMaster).filter(ProcedureMaster.is_active == True).all()

@router.post("", response_model=ProcedureMasterOut, status_code=201)
def create_procedure(data: ProcedureMasterCreate, db: Session = Depends(get_db)):
    proc = ProcedureMaster(**data.model_dump())
    db.add(proc)
    db.commit()
    db.refresh(proc)
    return proc

@router.put("/{procedure_id}", response_model=ProcedureMasterOut)
def update_procedure(procedure_id: int, data: ProcedureMasterCreate, db: Session = Depends(get_db)):
    proc = db.query(ProcedureMaster).filter(ProcedureMaster.id == procedure_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="시술을 찾을 수 없습니다.")
    
    for key, value in data.model_dump().items():
        setattr(proc, key, value)
        
    db.commit()
    db.refresh(proc)
    return proc

@router.delete("/{procedure_id}", status_code=204)
def delete_procedure(procedure_id: int, db: Session = Depends(get_db)):
    proc = db.query(ProcedureMaster).filter(ProcedureMaster.id == procedure_id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="시술을 찾을 수 없습니다.")
    
    proc.is_active = False
    db.commit()
