-- SQL for PostgreSQL students table
CREATE TABLE students (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(30),
  dob DATE NOT NULL,
  gender VARCHAR(30) NOT NULL,
  student_id VARCHAR(30),
  course VARCHAR(100) NOT NULL,
  year VARCHAR(30) NOT NULL,
  semester VARCHAR(30) NOT NULL,
  address VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(100),
  zip_code VARCHAR(20),
  registration_date TIMESTAMP NOT NULL DEFAULT NOW(),
  last_modified TIMESTAMP NOT NULL DEFAULT NOW()
);
