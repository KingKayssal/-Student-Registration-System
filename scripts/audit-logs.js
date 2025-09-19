// Audit Logs Page JavaScript
// Handles log export and dynamic log rendering

const logs = [
  { date: '2025-09-19 10:00', user: 'admin', action: 'Added Student', details: 'John Doe, Computer Science' },
  { date: '2025-09-19 10:05', user: 'editor', action: 'Edited Student', details: 'Jane Smith, Business Admin' }
  // Add more logs as needed
];

const logTable = document.querySelector('.table tbody');
const exportBtn = document.querySelector('.btn');

function renderLogs() {
  logTable.innerHTML = '';
  logs.forEach(log => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${log.date}</td>
      <td>${log.user}</td>
      <td>${log.action}</td>
      <td>${log.details}</td>
    `;
    logTable.appendChild(row);
  });
}

function exportLogs() {
  let csv = 'Date,User,Action,Details\n';
  logs.forEach(log => {
    csv += `${log.date},${log.user},${log.action},${log.details}\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'audit-logs.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

exportBtn.onclick = exportLogs;

renderLogs();
