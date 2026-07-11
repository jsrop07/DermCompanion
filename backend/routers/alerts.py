from datetime import datetime
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models.models import Alert
from schemas.schemas import AlertOut

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("", response_model=List[AlertOut])
def list_alerts(db: Session = Depends(get_db)):
    alerts = db.query(Alert).order_by(Alert.created_at.desc()).limit(20).all()
    result = []
    for a in alerts:
        diff = datetime.utcnow() - a.created_at
        if diff.seconds < 3600 and diff.days == 0:
            time_str = f"{max(1, diff.seconds // 60)}분 전"
        elif diff.days == 0:
            time_str = f"{diff.seconds // 3600}시간 전"
        else:
            time_str = f"{diff.days}일 전"

        result.append(AlertOut(
            id=a.id,
            type=a.type,
            patient=a.patient.name if a.patient else None,
            message=a.message,
            time=time_str,
            is_read=a.is_read,
        ))
    return result


@router.put("/{alert_id}/read", response_model=AlertOut)
def mark_alert_read(alert_id: int, db: Session = Depends(get_db)):
    alert = db.query(Alert).filter(Alert.id == alert_id).first()
    if not alert:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="알림을 찾을 수 없습니다.")
    alert.is_read = True
    db.commit()
    db.refresh(alert)
    diff = datetime.utcnow() - alert.created_at
    time_str = f"{max(1, diff.seconds // 60)}분 전"
    return AlertOut(
        id=alert.id,
        type=alert.type,
        patient=alert.patient.name if alert.patient else None,
        message=alert.message,
        time=time_str,
        is_read=alert.is_read,
    )
