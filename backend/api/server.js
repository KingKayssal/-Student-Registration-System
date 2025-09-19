// PostgreSQL connection and Express server setup
const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3001;

// Update these values with your pgAdmin/PostgreSQL credentials
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'student_registration',
  password: 'root',
  port: 5432,
});

app.use(cors());
app.use(express.json());

// Test connection
app.get('/api/ping', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all students
app.get('/api/students', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add a new student
app.post('/api/students', async (req, res) => {
  const student = req.body;
  try {
    // If student_id is provided, use it; otherwise, generate automatically
    let newId = student.studentId || student.student_id;
    if (!newId || newId.trim() === '') {
      const year = new Date().getFullYear();
      // Generate a random 4-digit number (allowing duplicates)
      const formatted = String(Math.floor(1000 + Math.random() * 9000));
      newId = `STU${year}${formatted}`;
    }
    // Map frontend fields to DB columns
    const dbStudent = {
      first_name: student.firstName,
      last_name: student.lastName,
      email: student.email,
      phone: student.phone,
      dob: student.dob,
      gender: student.gender,
      student_id: newId,
      course: student.course,
      year: student.year,
      semester: student.semester,
      address: student.address,
      city: student.city,
      state: student.state,
      zip_code: student.zipCode
    };
    // Defensive: Remove undefined/null/empty fields
    Object.keys(dbStudent).forEach(key => {
      if (dbStudent[key] === undefined || dbStudent[key] === null || dbStudent[key] === '') {
        dbStudent[key] = null;
      }
    });
    const result = await pool.query(
      `INSERT INTO students (first_name, last_name, email, phone, dob, gender, student_id, course, year, semester, address, city, state, zip_code, registration_date, last_modified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,NOW(),NOW()) RETURNING *`,
      [
        dbStudent.first_name,
        dbStudent.last_name,
        dbStudent.email,
        dbStudent.phone,
        dbStudent.dob,
        dbStudent.gender,
        dbStudent.student_id,
        dbStudent.course,
        dbStudent.year,
        dbStudent.semester,
        dbStudent.address,
        dbStudent.city,
        dbStudent.state,
        dbStudent.zip_code
      ]
    );
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Log the error for debugging
    console.error('Registration error:', err);
    return res.status(500).json({ error: err.message || 'Registration failed' });
  }
// Catch-all for unknown routes, always return JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});
});

// Get a student by ID
app.get('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM students WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a student
app.put('/api/students/:id', async (req, res) => {
  const student = req.body;
  try {
    const result = await pool.query(
      `UPDATE students SET first_name=$1, last_name=$2, email=$3, phone=$4, dob=$5, gender=$6, student_id=$7, course=$8, year=$9, semester=$10, address=$11, city=$12, state=$13, zip_code=$14, last_modified=NOW() WHERE id=$15 RETURNING *`,
      [student.firstName, student.lastName, student.email, student.phone, student.dob, student.gender, student.studentId, student.course, student.year, student.semester, student.address, student.city, student.state, student.zipCode, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a student
app.delete('/api/students/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Student not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Backend API running at http://localhost:${port}`);
});
