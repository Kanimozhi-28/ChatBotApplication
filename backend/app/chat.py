import os
import sqlite3
import socketio
from fastapi import APIRouter, HTTPException, Depends, Query
from typing import List, Dict
from datetime import datetime

router = APIRouter()

# Initialize Socket.IO server (async)
sio = socketio.AsyncServer(cors_allowed_origins="*")
# Mount ASGI app elsewhere (in main) if needed

JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key")
JWT_ALGORITHM = "HS256"

def get_db_connection():
    conn = sqlite3.connect("hr_chat_app.db")
    conn.row_factory = sqlite3.Row
    return conn

def get_current_user(access_token: str = Query(..., alias="access_token")):
    try:
        import jwt
        payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {"user_id": payload["sub"], "user_type": payload["type"]}
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# In‑memory store for recent messages (optional, for demo)
# Structure: {(admin_id, candidate_id): [msg_dict, ...]}
message_store: Dict[tuple, List[Dict]] = {}

@router.post("/send", tags=["chat"])
async def send_message(
    receiver_id: int,
    message: str,
    user=Depends(get_current_user),
):
    """Send a message from the current user to the specified receiver.
    For admin->candidate, receiver_id is candidate id.
    For candidate->admin, receiver_id is admin id (use 0 for single admin).
    """
    sender_id = user["user_id"]
    sender_type = user["user_type"]
    # Persist to DB
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO chat_messages (sender_id, sender_type, receiver_id, message) VALUES (?, ?, ?, ?)",
        (sender_id, sender_type, receiver_id, message),
    )
    conn.commit()
    cursor.close()
    conn.close()
    # Update in‑memory store
    key = (sender_id, receiver_id) if sender_type == "admin" else (receiver_id, sender_id)
    message_store.setdefault(key, []).append({"sender_id": sender_id, "sender_type": sender_type, "message": message, "created_at": datetime.utcnow()})
    # Emit via Socket.IO to the appropriate room
    room = f"admin_{receiver_id}" if sender_type == "candidate" else f"candidate_{receiver_id}"
    await sio.emit("new_message", {"sender_id": sender_id, "sender_type": sender_type, "message": message}, room=room)
    return {"detail": "Message sent"}

@router.get("/messages/{candidate_id}", tags=["chat"])
async def get_messages(candidate_id: int, user=Depends(get_current_user)):
    """Retrieve chat history for a candidate (admin can view any candidate, candidate can view own)."""
    if user["user_type"] == "candidate" and user["user_id"] != candidate_id:
        raise HTTPException(status_code=403, detail="Candidates can only view their own chat")
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM chat_messages WHERE (sender_type='candidate' AND sender_id=?) OR (sender_type='admin' AND receiver_id=?) ORDER BY created_at",
        (candidate_id, candidate_id),
    )
    rows = cursor.fetchall()
    cursor.close()
    conn.close()
    return rows

# Socket.IO connection handlers
@sio.event
async def connect(sid, environ, auth):
    token = auth.get("access_token") if auth else None
    if not token:
        raise ConnectionRefusedError("Missing token")
    try:
        import jwt
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload["sub"]
        user_type = payload["type"]
        # Join a room based on role and id
        if user_type == "admin":
            room = f"admin_{user_id}"
        else:
            room = f"candidate_{user_id}"
        await sio.save_session(sid, {"user_id": user_id, "user_type": user_type, "room": room})
        await sio.enter_room(sid, room)
    except Exception:
        raise ConnectionRefusedError("Invalid token")

@sio.event
async def disconnect(sid):
    session = await sio.get_session(sid)
    if session:
        await sio.leave_room(sid, session["room"])
