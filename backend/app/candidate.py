import os
import shutil
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Query
from typing import List
import sqlite3
from .dependencies import get_current_user

# Reuse JWT secret from auth module (environment variable)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

router = APIRouter()

def get_db_connection():
    conn = sqlite3.connect("hr_chat_app.db")
    conn.row_factory = sqlite3.Row
    return conn

def save_upload(file: UploadFile, candidate_id: int, subfolder: str) -> str:
    # Ensure upload directory exists
    base_dir = os.path.abspath(os.path.join(os.getcwd(), "uploads", str(candidate_id), subfolder))
    os.makedirs(base_dir, exist_ok=True)
    # Generate unique filename
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{file.filename}"
    file_path = os.path.join(base_dir, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return file_path

@router.post("/upload/resume", tags=["candidate"])
async def upload_resume(file: UploadFile = File(...), user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can upload")
    candidate_id = user["user_id"]
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"]:
        raise HTTPException(status_code=400, detail="Invalid file type")
    # Size check (max 5MB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    file_path = save_upload(file, candidate_id, "resume")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE candidates SET resume_path=?, resume_uploaded=1 WHERE id=?",
        (file_path, candidate_id),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"detail": "Resume uploaded successfully"}

@router.post("/upload/skills", tags=["candidate"])
async def upload_skills(file: UploadFile = File(...), user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can upload")
    candidate_id = user["user_id"]
    file_path = save_upload(file, candidate_id, "skills")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE candidates SET skills_summary_path=?, skills_uploaded=1 WHERE id=?",
        (file_path, candidate_id),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"detail": "Skills summary uploaded successfully"}

@router.post("/upload/notice-period", tags=["candidate"])
async def upload_notice(file: UploadFile = File(...), user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can upload")
    candidate_id = user["user_id"]
    file_path = save_upload(file, candidate_id, "notice")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE candidates SET notice_period_path=?, notice_period_uploaded=1 WHERE id=?",
        (file_path, candidate_id),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"detail": "Notice period document uploaded successfully"}

@router.post("/system-check", tags=["candidate"])
async def system_check(user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can perform system check")
    candidate_id = user["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE candidates SET system_check_completed=1 WHERE id=?",
        (candidate_id,),
    )
    conn.commit()
    cursor.close()
    conn.close()
    return {"detail": "System check marked as completed"}

@router.get("/status", tags=["candidate"])
async def get_status(user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view status")
    candidate_id = user["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT resume_uploaded, skills_uploaded, system_check_completed, notice_period_uploaded FROM candidates WHERE id=?",
        (candidate_id,),
    )
    row = cursor.fetchone()
    cursor.close()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return row

@router.get("/notifications", tags=["candidate"])
async def get_notifications(user=Depends(get_current_user)):
    if user["user_type"] != "candidate":
        raise HTTPException(status_code=403, detail="Only candidates can view notifications")
    candidate_id = user["user_id"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, message, is_read, created_at FROM notifications WHERE candidate_id=? ORDER BY created_at DESC",
        (candidate_id,),
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows
