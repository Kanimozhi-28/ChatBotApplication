from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app import auth, candidate, admin, chat
import socketio

app = FastAPI(title="HR Chat Application Backend")

# CORS (allow all for demo)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(candidate.router, prefix="/api/candidate", tags=["candidate"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])

# Mount Socket.IO ASGI app
sio = chat.sio
app.mount("/ws", socketio.ASGIApp(sio))

# Root endpoint
@app.get("/")
async def root():
    return {"message": "HR Chat Application Backend is running"}
