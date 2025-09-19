// View Students Page JavaScript
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
const studentsPerPage = 10;
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    setupEventListeners();
    updateDisplay();
});

function setupEventListeners() {
    // Search and filter controls
    document.getElementById('searchInput').addEventListener('input', filterStudents);
    document.getElementById('courseFilter').addEventListener('change', filterStudents);
    document.getElementById('yearFilter').addEventListener('change', filterStudents);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);

    // Advanced search controls
    document.getElementById('genderFilter').addEventListener('change', filterStudents);
    document.getElementById('semesterFilter').addEventListener('change', filterStudents);
    document.getElementById('dateFromFilter').addEventListener('change', filterStudents);
    document.getElementById('dateToFilter').addEventListener('change', filterStudents);
    document.getElementById('ageFromFilter').addEventListener('input', filterStudents);
    document.getElementById('ageToFilter').addEventListener('input', filterStudents);

    // Pagination
    document.getElementById('prevPage').addEventListener('click', () => changePage(-1));
    document.getElementById('nextPage').addEventListener('click', () => changePage(1));

    // Modal close
    document.querySelector('.close').addEventListener('click', closeModal);
    window.addEventListener('click', function(e) {
        const modal = document.getElementById('studentModal');
        if (e.target === modal) {
            closeModal();
        }
    });
}

function loadStudents() {
    // Load students from backend API
    apiClient.getStudents()
        .then(students => {
            allStudents = students;
            filteredStudents = [...allStudents];
            // Sort by registration date (newest first)
            filteredStudents.sort((a, b) => new Date(b.registration_date || b.registrationDate) - new Date(a.registration_date || a.registrationDate));
            updateDisplay();
        })
        .catch(err => {
            showNotification('Failed to load students: ' + (err.message || err), 'error');
            allStudents = [];
            filteredStudents = [];
            updateDisplay();
        });
}

function updateDisplay() {
    updateStats();
    updateTable();
    updatePagination();
}

function updateStats() {
    const totalStudents = allStudents.length;
    const uniqueCourses = new Set(allStudents.map(student => student.course)).size;
    const newestStudent = allStudents.length > 0 ? 
        new Date(Math.max(...allStudents.map(s => new Date(s.registrationDate)))).toLocaleDateString() : 
        '-';
    
    document.getElementById('totalStudents').textContent = totalStudents;
    document.getElementById('totalCourses').textContent = uniqueCourses;
    document.getElementById('newestStudent').textContent = newestStudent;
}

function updateTable() {
    const tableBody = document.getElementById('studentsTableBody');
    const table = document.getElementById('studentsTable');
    const noStudents = document.getElementById('noStudents');
    
    if (filteredStudents.length === 0) {
        table.style.display = 'none';
        noStudents.style.display = 'block';
        return;
    }
    
    table.style.display = 'table';
    noStudents.style.display = 'none';
    
    // Calculate pagination
    const startIndex = (currentPage - 1) * studentsPerPage;
    const endIndex = startIndex + studentsPerPage;
    const studentsToShow = filteredStudents.slice(startIndex, endIndex);
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add student rows
    studentsToShow.forEach(student => {
        const row = createStudentRow(student);
        tableBody.appendChild(row);
    });
}

function createStudentRow(student) {
    const row = document.createElement('tr');

    const registrationDate = new Date(student.registrationDate).toLocaleDateString();
    const fullName = `${student.firstName} ${student.lastName}`;

    row.innerHTML = `
        <td><input type="checkbox" class="student-checkbox" value="${student.id}" onchange="updateBulkActions()"></td>
        <td>${student.studentId || 'N/A'}</td>
        <td>${fullName}</td>
        <td>${student.email}</td>
        <td>${student.course}</td>
        <td>${student.year}</td>
        <td>${student.semester}</td>
        <td>${registrationDate}</td>
        <td>
            <button class="action-btn view" onclick="viewStudent(${student.id})">View</button>
            <button class="action-btn edit" onclick="editStudent(${student.id})">Edit</button>
            <button class="action-btn delete" onclick="deleteStudent(${student.id})">Delete</button>
        </td>
    `;

    return row;
}

function updatePagination() {
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
    
    if (totalPages === 0) {
        pageInfo.textContent = 'No pages';
    } else {
        pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    }
}

function filterStudents() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const courseFilter = document.getElementById('courseFilter').value;
    const yearFilter = document.getElementById('yearFilter').value;
    const genderFilter = document.getElementById('genderFilter').value;
    const semesterFilter = document.getElementById('semesterFilter').value;
    const dateFromFilter = document.getElementById('dateFromFilter').value;
    const dateToFilter = document.getElementById('dateToFilter').value;
    const ageFromFilter = document.getElementById('ageFromFilter').value;
    const ageToFilter = document.getElementById('ageToFilter').value;

    filteredStudents = allStudents.filter(student => {
        // Basic search
        const matchesSearch = !searchTerm ||
            student.firstName.toLowerCase().includes(searchTerm) ||
            student.lastName.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm) ||
            student.course.toLowerCase().includes(searchTerm) ||
            (student.studentId && student.studentId.toLowerCase().includes(searchTerm));

        // Basic filters
        const matchesCourse = !courseFilter || student.course === courseFilter;
        const matchesYear = !yearFilter || student.year === yearFilter;
        const matchesGender = !genderFilter || student.gender === genderFilter;
        const matchesSemester = !semesterFilter || student.semester === semesterFilter;

        // Date range filter
        let matchesDateRange = true;
        if (dateFromFilter || dateToFilter) {
            const studentDate = new Date(student.registrationDate);
            if (dateFromFilter) {
                matchesDateRange = matchesDateRange && studentDate >= new Date(dateFromFilter);
            }
            if (dateToFilter) {
                matchesDateRange = matchesDateRange && studentDate <= new Date(dateToFilter + 'T23:59:59');
            }
        }

        // Age range filter
        let matchesAgeRange = true;
        if (ageFromFilter || ageToFilter) {
            const age = calculateAge(student.dob);
            if (ageFromFilter) {
                matchesAgeRange = matchesAgeRange && age >= parseInt(ageFromFilter);
            }
            if (ageToFilter) {
                matchesAgeRange = matchesAgeRange && age <= parseInt(ageToFilter);
            }
        }

        return matchesSearch && matchesCourse && matchesYear &&
               matchesGender && matchesSemester && matchesDateRange && matchesAgeRange;
    });

    // Reset to first page when filtering
    currentPage = 1;
    updateDisplay();
}

function calculateAge(dateString) {
    if (!dateString) return 0;
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('courseFilter').value = '';
    document.getElementById('yearFilter').value = '';
    document.getElementById('genderFilter').value = '';
    document.getElementById('semesterFilter').value = '';
    document.getElementById('dateFromFilter').value = '';
    document.getElementById('dateToFilter').value = '';
    document.getElementById('ageFromFilter').value = '';
    document.getElementById('ageToFilter').value = '';

    filteredStudents = [...allStudents];
    currentPage = 1;
    updateDisplay();
}

function toggleAdvancedSearch() {
    const advancedSearch = document.getElementById('advancedSearch');
    const toggleButton = document.getElementById('toggleAdvanced');

    if (advancedSearch.style.display === 'none') {
        advancedSearch.style.display = 'block';
        toggleButton.textContent = '🔼 Hide Advanced Search';
    } else {
        advancedSearch.style.display = 'none';
        toggleButton.textContent = '🔍 Advanced Search';
    }
}

function applyAdvancedFilters() {
    filterStudents();
    showNotification('Advanced filters applied', 'success');
}

function changePage(direction) {
    const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
    const newPage = currentPage + direction;
    
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        updateTable();
        updatePagination();
    }
}

function viewStudent(studentId) {
    const student = allStudents.find(s => s.id === studentId);
    if (!student) return;
    
    currentStudentId = studentId;
    
    const modalBody = document.getElementById('studentDetails');
    modalBody.innerHTML = `
        <div class="detail-section">
            <h4>Personal Information</h4>
            <div class="detail-group">
                <label>Full Name:</label>
                <span>${student.firstName} ${student.lastName}</span>
            </div>
            <div class="detail-group">
                <label>Email:</label>
                <span>${student.email}</span>
            </div>
            <div class="detail-group">
                <label>Phone:</label>
                <span>${student.phone || 'Not provided'}</span>
            </div>
            <div class="detail-group">
                <label>Date of Birth:</label>
                <span>${new Date(student.dob).toLocaleDateString()}</span>
            </div>
            <div class="detail-group">
                <label>Gender:</label>
                <span>${student.gender}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Academic Information</h4>
            <div class="detail-group">
                <label>Student ID:</label>
                <span>${student.studentId || 'Auto-generated'}</span>
            </div>
            <div class="detail-group">
                <label>Course/Program:</label>
                <span>${student.course}</span>
            </div>
            <div class="detail-group">
                <label>Academic Year:</label>
                <span>${student.year}</span>
            </div>
            <div class="detail-group">
                <label>Semester:</label>
                <span>${student.semester}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Address Information</h4>
            <div class="detail-group">
                <label>Street Address:</label>
                <span>${student.address || 'Not provided'}</span>
            </div>
            <div class="detail-group">
                <label>City:</label>
                <span>${student.city || 'Not provided'}</span>
            </div>
            <div class="detail-group">
                <label>State/Province:</label>
                <span>${student.state || 'Not provided'}</span>
            </div>
            <div class="detail-group">
                <label>ZIP/Postal Code:</label>
                <span>${student.zipCode || 'Not provided'}</span>
            </div>
        </div>
        
        <div class="detail-section">
            <h4>Registration Details</h4>
            <div class="detail-group">
                <label>Registration Date:</label>
                <span>${new Date(student.registrationDate).toLocaleString()}</span>
            </div>
        </div>
    `;
    
    document.getElementById('studentModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('studentModal').style.display = 'none';
    currentStudentId = null;
}

function editStudent(studentId) {
    if (studentId) {
        // Navigate to edit page with student ID
        window.location.href = `edit-student.html?id=${studentId}`;
    } else if (currentStudentId) {
        // Called from modal
        window.location.href = `edit-student.html?id=${currentStudentId}`;
    }
}

function deleteStudent(studentId) {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        apiClient.deleteStudent(studentId)
            .then(() => {
                showNotification('Student deleted successfully', 'success');
                loadStudents();
            })
            .catch(err => {
                showNotification('Failed to delete student: ' + (err.message || err), 'error');
            });
        // Close modal if it's open for this student
        if (currentStudentId === studentId) {
            closeModal();
        }
    }
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Style the notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${type === 'success' ? '#d4edda' : '#f8d7da'};
        color: ${type === 'success' ? '#155724' : '#721c24'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'};
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        transition: all 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Bulk Operations
function toggleSelectAll() {
    const headerCheckbox = document.getElementById('headerCheckbox');
    const studentCheckboxes = document.querySelectorAll('.student-checkbox');

    studentCheckboxes.forEach(checkbox => {
        checkbox.checked = headerCheckbox.checked;
    });

    updateBulkActions();
}

function updateBulkActions() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const bulkDeleteBtn = document.getElementById('bulkDelete');
    const headerCheckbox = document.getElementById('headerCheckbox');
    const allCheckboxes = document.querySelectorAll('.student-checkbox');

    // Update bulk delete button
    bulkDeleteBtn.disabled = selectedCheckboxes.length === 0;
    bulkDeleteBtn.textContent = `Delete Selected (${selectedCheckboxes.length})`;

    // Update header checkbox state
    if (selectedCheckboxes.length === 0) {
        headerCheckbox.indeterminate = false;
        headerCheckbox.checked = false;
    } else if (selectedCheckboxes.length === allCheckboxes.length) {
        headerCheckbox.indeterminate = false;
        headerCheckbox.checked = true;
    } else {
        headerCheckbox.indeterminate = true;
    }
}

function bulkDeleteStudents() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));

    if (selectedIds.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} student(s)? This action cannot be undone.`;

    if (confirm(confirmMessage)) {
        Promise.all(selectedIds.map(id => apiClient.deleteStudent(id)))
            .then(() => {
                showNotification(`${selectedIds.length} student(s) deleted successfully`, 'success');
                loadStudents();
            })
            .catch(err => {
                showNotification('Failed to delete some students: ' + (err.message || err), 'error');
            });
    }
}

// Export Functions
function exportToCSV() {
    if (filteredStudents.length === 0) {
        showNotification('No students to export', 'error');
        return;
    }

    const headers = [
        'Student ID', 'First Name', 'Last Name', 'Email', 'Phone',
        'Date of Birth', 'Gender', 'Course', 'Academic Year', 'Semester',
        'Address', 'City', 'State', 'ZIP Code', 'Registration Date'
    ];

    const csvContent = [
        headers.join(','),
        ...filteredStudents.map(student => [
            student.studentId || '',
            student.firstName || '',
            student.lastName || '',
            student.email || '',
            student.phone || '',
            student.dob || '',
            student.gender || '',
            student.course || '',
            student.year || '',
            student.semester || '',
            student.address || '',
            student.city || '',
            student.state || '',
            student.zipCode || '',
            new Date(student.registrationDate).toLocaleDateString()
        ].map(field => `"${field}"`).join(','))
    ].join('\n');

    downloadFile(csvContent, 'students.csv', 'text/csv');
    showNotification(`Exported ${filteredStudents.length} students to CSV`, 'success');
}

function exportToPDF() {
    if (filteredStudents.length === 0) {
        showNotification('No students to export', 'error');
        return;
    }

    // Create a simple HTML table for PDF export
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Student List</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                h1 { color: #1e3c72; text-align: center; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #1e3c72; color: white; }
                tr:nth-child(even) { background-color: #f2f2f2; }
                .export-info { text-align: center; margin-bottom: 20px; color: #666; }
            </style>
        </head>
        <body>
            <h1>🎓 Student Registration System</h1>
            <div class="export-info">
                <p>Export Date: ${new Date().toLocaleDateString()}</p>
                <p>Total Students: ${filteredStudents.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Course</th>
                        <th>Year</th>
                        <th>Registration Date</th>
                    </tr>
                </thead>
                <tbody>
                    ${filteredStudents.map(student => `
                        <tr>
                            <td>${student.studentId || 'N/A'}</td>
                            <td>${student.firstName} ${student.lastName}</td>
                            <td>${student.email}</td>
                            <td>${student.course}</td>
                            <td>${student.year}</td>
                            <td>${new Date(student.registrationDate).toLocaleDateString()}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </body>
        </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Auto-trigger print dialog
    setTimeout(() => {
        printWindow.print();
    }, 500);

    showNotification(`PDF export opened in new window`, 'success');
}

function downloadFile(content, filename, contentType) {
    const blob = new Blob([content], { type: contentType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}
