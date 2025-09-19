-- Student Registration System Database Schema
-- For use with WAMP/phpMyAdmin on Windows

-- Create database
CREATE DATABASE IF NOT EXISTS student_registration_system 
CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE student_registration_system;

-- Create students table
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE NOT NULL,
    gender ENUM('Male', 'Female', 'Other', 'Prefer not to say') NOT NULL,
    course VARCHAR(100) NOT NULL,
    academic_year ENUM('1st Year', '2nd Year', '3rd Year', '4th Year', 'Graduate') NOT NULL,
    semester ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    zip_code VARCHAR(10),
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    status ENUM('Active', 'Inactive', 'Graduated', 'Suspended') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('admin', 'staff', 'viewer') DEFAULT 'staff',
    last_login TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create sessions table for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, full_name, role) VALUES 
('admin', 'admin@school.edu', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', 'admin');

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('school_name', 'University of Excellence', 'Name of the educational institution'),
('academic_year', '2024-2025', 'Current academic year'),
('student_id_prefix', 'STU2025', 'Prefix for auto-generated student IDs'),
('phone_format', '(237)690-000-000', 'Phone number format pattern'),
('default_semester', 'Fall', 'Default semester for new registrations'),
('max_students_per_course', '100', 'Maximum students allowed per course'),
('registration_enabled', 'true', 'Whether new registrations are allowed'),
('email_notifications', 'true', 'Whether to send email notifications');

-- Create indexes for better performance
CREATE INDEX idx_students_email ON students(email);
CREATE INDEX idx_students_student_id ON students(student_id);
CREATE INDEX idx_students_course ON students(course);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_registration_date ON students(registration_date);
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_sessions_expires ON user_sessions(expires_at);

-- Create views for common queries
CREATE VIEW active_students AS
SELECT 
    id, student_id, first_name, last_name, email, phone,
    date_of_birth, gender, course, academic_year, semester,
    address, city, state, zip_code, registration_date
FROM students 
WHERE status = 'Active';

CREATE VIEW student_summary AS
SELECT 
    course,
    academic_year,
    semester,
    COUNT(*) as student_count,
    COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
    COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count,
    AVG(YEAR(CURDATE()) - YEAR(date_of_birth)) as avg_age
FROM students 
WHERE status = 'Active'
GROUP BY course, academic_year, semester;

-- Create stored procedures
DELIMITER //

-- Procedure to generate next student ID
CREATE PROCEDURE GetNextStudentId(OUT next_id VARCHAR(20))
BEGIN
    DECLARE max_num INT DEFAULT 0;
    DECLARE prefix VARCHAR(10);
    
    SELECT setting_value INTO prefix FROM system_settings WHERE setting_key = 'student_id_prefix';
    
    SELECT COALESCE(MAX(CAST(SUBSTRING(student_id, LENGTH(prefix) + 1) AS UNSIGNED)), 0) 
    INTO max_num 
    FROM students 
    WHERE student_id LIKE CONCAT(prefix, '%');
    
    SET next_id = CONCAT(prefix, LPAD(max_num + 1, 4, '0'));
END //

-- Procedure to log audit events
CREATE PROCEDURE LogAuditEvent(
    IN p_user_id INT,
    IN p_action VARCHAR(50),
    IN p_table_name VARCHAR(50),
    IN p_record_id INT,
    IN p_old_values JSON,
    IN p_new_values JSON,
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    INSERT INTO audit_log (user_id, action, table_name, record_id, old_values, new_values, ip_address, user_agent)
    VALUES (p_user_id, p_action, p_table_name, p_record_id, p_old_values, p_new_values, p_ip_address, p_user_agent);
END //

DELIMITER ;

-- Create triggers for audit logging
DELIMITER //

CREATE TRIGGER students_after_insert
AFTER INSERT ON students
FOR EACH ROW
BEGIN
    CALL LogAuditEvent(
        NULL, 'INSERT', 'students', NEW.id, 
        NULL, JSON_OBJECT('student_id', NEW.student_id, 'email', NEW.email), 
        NULL, NULL
    );
END //

CREATE TRIGGER students_after_update
AFTER UPDATE ON students
FOR EACH ROW
BEGIN
    CALL LogAuditEvent(
        NULL, 'UPDATE', 'students', NEW.id,
        JSON_OBJECT('student_id', OLD.student_id, 'email', OLD.email),
        JSON_OBJECT('student_id', NEW.student_id, 'email', NEW.email),
        NULL, NULL
    );
END //

CREATE TRIGGER students_after_delete
AFTER DELETE ON students
FOR EACH ROW
BEGIN
    CALL LogAuditEvent(
        NULL, 'DELETE', 'students', OLD.id,
        JSON_OBJECT('student_id', OLD.student_id, 'email', OLD.email),
        NULL, NULL, NULL
    );
END //

DELIMITER ;

-- Sample data for testing (optional)
INSERT INTO students (
    student_id, first_name, last_name, email, phone, date_of_birth, 
    gender, course, academic_year, semester, address, city, state, zip_code
) VALUES 
('STU20250001', 'John', 'Doe', 'john.doe@email.com', '(237)690-123-456', '2000-01-15', 
 'Male', 'Computer Science', '2nd Year', 'Fall', '123 Main St', 'Douala', 'Littoral', '12345'),
('STU20250002', 'Jane', 'Smith', 'jane.smith@email.com', '(237)690-789-012', '1999-05-20', 
 'Female', 'Business Administration', '3rd Year', 'Fall', '456 Oak Ave', 'Yaounde', 'Centre', '67890'),
('STU20250003', 'Mike', 'Johnson', 'mike.johnson@email.com', '(237)690-345-678', '2001-03-10', 
 'Male', 'Engineering', '1st Year', 'Fall', '789 Pine Rd', 'Bamenda', 'Northwest', '54321');

-- Remove unique constraint from email and student_id if they exist (for upgrades)
ALTER TABLE students DROP INDEX email, DROP INDEX students_email_key, DROP CONSTRAINT students_email_key, DROP INDEX student_id, DROP INDEX students_student_id_key, DROP CONSTRAINT students_student_id_key;

-- Grant permissions (adjust as needed for your WAMP setup)
-- GRANT ALL PRIVILEGES ON student_registration_system.* TO 'root'@'localhost';
-- FLUSH PRIVILEGES;
