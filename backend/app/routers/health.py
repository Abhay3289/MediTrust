from fastapi import APIRouter
from app.db.database import engine
from sqlalchemy import text
router=APIRouter(tags=["Health"])
@router.get("/health", summary="API health check")
def health(): return {"status":"ok"}
@router.get("/health/db", summary="Database health check")
def db_health():
    with engine.connect() as c: c.execute(text("SELECT 1"))
    return {"status":"ok","database":"connected"}
