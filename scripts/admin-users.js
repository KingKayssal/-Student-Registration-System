// User Management Page JavaScript
// Handles add, edit, delete, and table updates for admin users

const adminForm = document.getElementById('adminForm');
const adminTable = document.getElementById('adminTable').getElementsByTagName('tbody')[0];
const successMsg = document.getElementById('successMsg');
const errorMsg = document.getElementById('errorMsg');

// In-memory admin users (replace with API/database in production)
let adminUsers = [
  { username: 'admin', email: 'admin@email.com', role: 'Admin', status: 'Active' },
  { username: 'editor', email: 'editor@email.com', role: 'Editor', status: 'Active' }
];
let editIndex = null;

function renderTable() {
  adminTable.innerHTML = '';
  adminUsers.forEach((user, idx) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${user.username}</td>
      <td>${user.email}</td>
      <td>${user.role}</td>
      <td>${user.status}</td>
      <td class="actions">
        <button class="btn btn-secondary" onclick="editUser(${idx})">Edit</button>
        <button class="btn" onclick="deleteUser(${idx})">Delete</button>
      </td>
    `;
    adminTable.appendChild(row);
  });
}

function showMessage(type, msg) {
  successMsg.style.display = type === 'success' ? 'block' : 'none';
  errorMsg.style.display = type === 'error' ? 'block' : 'none';
  if (type === 'success') successMsg.textContent = msg;
  if (type === 'error') errorMsg.textContent = msg;
  setTimeout(() => {
    successMsg.style.display = 'none';
    errorMsg.style.display = 'none';
  }, 2000);
}

adminForm.onsubmit = function(e) {
  e.preventDefault();
  const user = {
    username: adminForm.username.value.trim(),
    email: adminForm.email.value.trim(),
    role: adminForm.role.value,
    status: adminForm.status.value
  };
  if (editIndex !== null) {
    adminUsers[editIndex] = user;
    showMessage('success', 'User updated successfully!');
    editIndex = null;
  } else {
    adminUsers.push(user);
    showMessage('success', 'User added successfully!');
  }
  adminForm.reset();
  renderTable();
};

window.editUser = function(idx) {
  const user = adminUsers[idx];
  adminForm.username.value = user.username;
  adminForm.email.value = user.email;
  adminForm.role.value = user.role;
  adminForm.status.value = user.status;
  editIndex = idx;
};

window.deleteUser = function(idx) {
  if (confirm('Are you sure you want to delete this user?')) {
    adminUsers.splice(idx, 1);
    showMessage('success', 'User deleted successfully!');
    renderTable();
    adminForm.reset();
    editIndex = null;
  }
};

adminForm.onreset = function() {
  editIndex = null;
};

// Initial render
renderTable();
