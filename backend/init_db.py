import sqlite3
import os

DB_NAME = "hr_chat_app.db"

def init_db():
    if os.path.exists(DB_NAME):
        os.remove(DB_NAME)

    conn = sqlite3.connect(DB_NAME)
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS candidates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        resume_path TEXT,
        skills_summary_path TEXT,
        notice_period_path TEXT,
        resume_uploaded BOOLEAN DEFAULT 0,
        skills_uploaded BOOLEAN DEFAULT 0,
        system_check_completed BOOLEAN DEFAULT 0,
        notice_period_uploaded BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS admin (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        api_key TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        candidate_id INTEGER,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sender_id INTEGER NOT NULL,
        sender_type TEXT NOT NULL, -- ENUM replaced by TEXT
        receiver_id INTEGER,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # Create Trigger (SQLite syntax)
    cursor.executescript("""
    CREATE TRIGGER IF NOT EXISTS after_resume_upload
    AFTER UPDATE OF resume_uploaded ON candidates
    WHEN NEW.resume_uploaded = 1 AND OLD.resume_uploaded = 0
    BEGIN
        INSERT INTO notifications (candidate_id, message)
        VALUES (NEW.id, 'Resume uploaded by ' || NEW.name);
    END;
    """)

    # Seed Admin User (password: admin123)
    # Hash for 'admin123' generated via bcrypt just for demo or hardcoded valid hash if available. 
    # For now, we will skip seeding or let the user register. 
    # Actually, let's seed a default admin for easier testing.
    # Hash for 'admin123' is '$2b$12$...' - let's use a dummy hash or real one if we can import bcrypt.
    # We'll just create the table structure for now to keep it simple as per plan.

    conn.commit()
    conn.close()
    print(f"Database {DB_NAME} initialized successfully.")

if __name__ == "__main__":
    init_db()
