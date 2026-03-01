# HR Chat Application

This project consists of a FastAPI backend and a Next.js frontend.

## Prerequisites

- [Python 3.8+](https://www.python.org/downloads/)
- [Node.js 18+](https://nodejs.org/)

## Setup & Run Instructions

### 1. Backend Setup

Open a terminal in the root directory (`CHATBOTAPPLICATION`).

```powershell
# Install Python dependencies
pip install -r backend/requirements.txt
```

To run the server, navigate to the `backend` directory:

```powershell
cd backend

# Initialize the database
python init_db.py

# Run the backend server
python -m uvicorn main:app --reload
```

The backend will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Open a **new** terminal window and navigate to the `hr-chat-app` directory:

```powershell
cd hr-chat-app

# Install Node.js dependencies
npm install

# Run the development server
npm run dev
```

The frontend will start at `http://localhost:3000`.

## Accessing the Application

Open your browser and navigate to [http://localhost:3000](http://localhost:3000).
