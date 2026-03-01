-- init_db.sql: Database schema and triggers for HR Chat Application

CREATE DATABASE IF NOT EXISTS hr_chat_app;
USE hr_chat_app;

CREATE TABLE IF NOT EXISTS candidates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    resume_path VARCHAR(500),
    skills_summary_path VARCHAR(500),
    notice_period_path VARCHAR(500),
    resume_uploaded BOOLEAN DEFAULT 0,
    skills_uploaded BOOLEAN DEFAULT 0,
    system_check_completed BOOLEAN DEFAULT 0,
    notice_period_uploaded BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admin (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    api_key VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    candidate_id INT,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    sender_type ENUM('admin', 'candidate') NOT NULL,
    receiver_id INT,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$
CREATE TRIGGER after_resume_upload
AFTER UPDATE ON candidates
FOR EACH ROW
BEGIN
    IF NEW.resume_uploaded = 1 AND OLD.resume_uploaded = 0 THEN
        INSERT INTO notifications (candidate_id, message)
        VALUES (NEW.id, CONCAT('Resume uploaded by ', NEW.name));
    END IF;
END$$
DELIMITER ;
