-- Remove unique constraints from email and student_id in PostgreSQL
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_email_key;
ALTER TABLE students DROP CONSTRAINT IF EXISTS students_student_id_key;
DROP INDEX IF EXISTS idx_students_email;
DROP INDEX IF EXISTS idx_students_student_id;
