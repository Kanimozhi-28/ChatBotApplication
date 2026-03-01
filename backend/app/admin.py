import os
import sqlite3
from fastapi import APIRouter, HTTPException, Depends, Query
from .dependencies import get_current_user

router = APIRouter()

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

def get_db_connection():
    conn = sqlite3.connect("hr_chat_app.db")
    conn.row_factory = sqlite3.Row
    return conn

@router.get("/candidates", tags=["admin"])
async def list_candidates(user=Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, name, email, resume_uploaded, skills_uploaded, system_check_completed, notice_period_uploaded FROM candidates"
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

@router.get("/candidate/{candidate_id}", tags=["admin"])
async def get_candidate(candidate_id: int, user=Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM candidates WHERE id=?", (candidate_id,)
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return row

@router.post("/send-api-key", tags=["admin"])
async def send_api_key(user=Depends(get_current_user)):
    if user["user_type"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    # Placeholder implementation – in real app, send email or notification
    return {"detail": "API key sent to admin (placeholder)"}
