import os
from datetime import date, datetime
from zoneinfo import ZoneInfo


CLINIC_TIMEZONE_NAME = os.getenv(
    "CLINIC_TIMEZONE",
    "America/Chicago",
)


def clinic_timezone() -> ZoneInfo:
    return ZoneInfo(
        CLINIC_TIMEZONE_NAME
    )


def clinic_now() -> datetime:
    """
    텍사스 병원 현지 시각을 timezone 정보 없이 반환한다.

    현재 DB의 DateTime 컬럼들이 timezone 없는 datetime을 사용하고
    있기 때문에 기존 구조와 맞추기 위해 tzinfo를 제거한다.
    """
    return (
        datetime.now(clinic_timezone())
        .replace(tzinfo=None)
    )


def clinic_today() -> date:
    return clinic_now().date()