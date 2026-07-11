from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models.models import RecoveryGuide, RecoveryGuideStep
from schemas.schemas import (
    RecoveryGuideCreate, RecoveryGuideOut, RecoveryGuideListItem,
    RecoveryGuideStepCreate, RecoveryGuideStepOut,
)

router = APIRouter(prefix="/recovery-guides", tags=["recovery-guides"])


@router.get("", response_model=List[RecoveryGuideListItem])
def list_guides(db: Session = Depends(get_db)):
    guides = db.query(RecoveryGuide).filter(RecoveryGuide.is_active == True).all()
    result = []
    for g in guides:
        result.append(RecoveryGuideListItem(
            id=g.id,
            name=g.name,
            procedure_type=g.procedure_type,
            stages=len(g.steps),
            lastModified=g.updated_at.strftime("%Y-%m-%d") if g.updated_at else "",
        ))
    return result


@router.post("", response_model=RecoveryGuideOut, status_code=201)
def create_guide(data: RecoveryGuideCreate, db: Session = Depends(get_db)):
    guide = RecoveryGuide(**data.model_dump())
    db.add(guide)
    db.commit()
    db.refresh(guide)
    return _build_guide_out(guide)


@router.get("/{guide_id}", response_model=RecoveryGuideOut)
def get_guide(guide_id: int, db: Session = Depends(get_db)):
    guide = db.query(RecoveryGuide).filter(RecoveryGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="회복 가이드를 찾을 수 없습니다.")
    return _build_guide_out(guide)


@router.put("/{guide_id}", response_model=RecoveryGuideOut)
def update_guide(guide_id: int, data: RecoveryGuideCreate, db: Session = Depends(get_db)):
    guide = db.query(RecoveryGuide).filter(RecoveryGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="회복 가이드를 찾을 수 없습니다.")
    for key, value in data.model_dump().items():
        setattr(guide, key, value)
    db.commit()
    db.refresh(guide)
    return _build_guide_out(guide)


@router.delete("/{guide_id}", status_code=204)
def delete_guide(guide_id: int, db: Session = Depends(get_db)):
    guide = db.query(RecoveryGuide).filter(RecoveryGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="회복 가이드를 찾을 수 없습니다.")
    guide.is_active = False
    db.commit()


@router.get("/{guide_id}/steps", response_model=List[RecoveryGuideStepOut])
def get_guide_steps(guide_id: int, db: Session = Depends(get_db)):
    guide = db.query(RecoveryGuide).filter(RecoveryGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="회복 가이드를 찾을 수 없습니다.")
    return guide.steps


@router.post("/{guide_id}/steps", response_model=RecoveryGuideStepOut, status_code=201)
def add_guide_step(guide_id: int, data: RecoveryGuideStepCreate, db: Session = Depends(get_db)):
    guide = db.query(RecoveryGuide).filter(RecoveryGuide.id == guide_id).first()
    if not guide:
        raise HTTPException(status_code=404, detail="회복 가이드를 찾을 수 없습니다.")
    step = RecoveryGuideStep(guide_id=guide_id, **data.model_dump())
    db.add(step)
    db.commit()
    db.refresh(step)
    return step


@router.put("/{guide_id}/steps/{step_id}", response_model=RecoveryGuideStepOut)
def update_guide_step(
    guide_id: int, step_id: int, data: RecoveryGuideStepCreate, db: Session = Depends(get_db)
):
    step = db.query(RecoveryGuideStep).filter(
        RecoveryGuideStep.id == step_id,
        RecoveryGuideStep.guide_id == guide_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="단계를 찾을 수 없습니다.")
    for key, value in data.model_dump().items():
        setattr(step, key, value)
    db.commit()
    db.refresh(step)
    return step


@router.delete("/{guide_id}/steps/{step_id}", status_code=204)
def delete_guide_step(
    guide_id: int, step_id: int, db: Session = Depends(get_db)
):
    step = db.query(RecoveryGuideStep).filter(
        RecoveryGuideStep.id == step_id,
        RecoveryGuideStep.guide_id == guide_id
    ).first()
    if not step:
        raise HTTPException(status_code=404, detail="단계를 찾을 수 없습니다.")
    db.delete(step)
    db.commit()


def _build_guide_out(guide: RecoveryGuide) -> RecoveryGuideOut:
    return RecoveryGuideOut(
        id=guide.id,
        name=guide.name,
        procedure_type=guide.procedure_type,
        is_active=guide.is_active,
        stages_count=len(guide.steps),
        last_modified=guide.updated_at.strftime("%Y-%m-%d") if guide.updated_at else None,
        steps=[RecoveryGuideStepOut.model_validate(s) for s in guide.steps],
    )
