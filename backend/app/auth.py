import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr
import sqlite3

# Load environment variables or set defaults (in real project use .env)
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"
JWT_EXP_DELTA_SECONDS = 3600

# Database connection (simple singleton for demo)
def get_db_connection():
    conn = sqlite3.connect("hr_chat_app.db")
    conn.row_factory = sqlite3.Row
    return conn

router = APIRouter()

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

def create_access_token(user_id: int, user_type: str):
    payload = {
        "sub": user_id,
        "type": user_type,
        "exp": datetime.utcnow() + timedelta(seconds=JWT_EXP_DELTA_SECONDS),
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

@router.post("/register", tags=["auth"])
def register(payload: RegisterRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Check if email already exists
    cursor.execute("SELECT id FROM candidates WHERE email = ?", (payload.email,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="Email already registered")
    # Hash password
    hashed = bcrypt.hashpw(payload.password.encode("utf-8"), bcrypt.gensalt())
    # Insert candidate
    insert_sql = (
        "INSERT INTO candidates (name, email, password_hash) VALUES (?, ?, ?)"
    )
    cursor.execute(insert_sql, (payload.name, payload.email, hashed.decode()))
    conn.commit()
    candidate_id = cursor.lastrowid
    cursor.close()
    conn.close()
    token = create_access_token(candidate_id, "candidate")
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", tags=["auth"])
def login(payload: LoginRequest):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Try candidate table first
    cursor.execute(
        "SELECT id, password_hash FROM candidates WHERE email = ?", (payload.email,)
    )
    row = cursor.fetchone()
    if row:
        user_id, stored_hash = row
        if not bcrypt.checkpw(payload.password.encode("utf-8"), stored_hash.encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token(user_id, "candidate")
        cursor.close()
        conn.close()
        return {"access_token": token, "token_type": "bearer"}
    # Fallback to admin table
    cursor.execute(
        "SELECT id, password_hash FROM admin WHERE username = ?", (payload.email,)
    )
    admin_row = cursor.fetchone()
    if admin_row:
        admin_id, stored_hash = admin_row
        if not bcrypt.checkpw(payload.password.encode("utf-8"), stored_hash.encode()):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token(admin_id, "admin")
        cursor.close()
        conn.close()
        return {"access_token": token, "token_type": "bearer"}
    cursor.close()
    conn.close()
    raise HTTPException(status_code=401, detail="User not found")
