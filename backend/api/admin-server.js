// Simple Express backend for admin API (Node.js)
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// In-memory data for demonstration
let adminUsers = [
  { username: 'admin', email: 'admin@email.com', role: 'Admin', status: 'Active' },
  { username: 'editor', email: 'editor@email.com', role: 'Editor', status: 'Active' }
];
let auditLogs = [
  { date: '2025-09-19 10:00', user: 'admin', action: 'Added Student', details: 'John Doe, Computer Science' },
  { date: '2025-09-19 10:05', user: 'editor', action: 'Edited Student', details: 'Jane Smith, Business Admin' }
];

// Admin Users API
app.get('/api/admin-users', (req, res) => {
  res.json(adminUsers);
});
app.post('/api/admin-users', (req, res) => {
  adminUsers.push(req.body);
  res.json({ success: true });
});
app.put('/api/admin-users/:index', (req, res) => {
  adminUsers[req.params.index] = req.body;
  res.json({ success: true });
});
app.delete('/api/admin-users/:index', (req, res) => {
  adminUsers.splice(req.params.index, 1);
  res.json({ success: true });
});

// Audit Logs API
app.get('/api/audit-logs', (req, res) => {
  res.json(auditLogs);
});
app.post('/api/audit-logs', (req, res) => {
  auditLogs.push(req.body);
  res.json({ success: true });
});

// Health check
app.get('/api/ping', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

app.listen(port, () => {
  console.log(`Admin API running at http://localhost:${port}`);
});
