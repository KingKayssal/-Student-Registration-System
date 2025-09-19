// View Students Page JavaScript with API integration
let allStudents = [];
let filteredStudents = [];
let currentPage = 1;
const studentsPerPage = 10;
let currentStudentId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadStudents();
    setupEventListeners();
});

function setupEventListeners() {
    // Search and filter controls
    document.getElementById('searchInput').addEventListener('input', debounce(filterStudents, 300));
    document.getElementById('courseFilter').addEventListener('change', filterStudents);
    document.getElementById('yearFilter').addEventListener('change', filterStudents);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    
    // Advanced search controls
    document.getElementById('genderFilter').addEventListener('change', filterStudents);
    document.getElementById('semesterFilter').addEventListener('change', filterStudents);
    document.getElementById('dateFromFilter').addEventListener('change', filterStudents);
    document.getElementById('dateToFilter').addEventListener('change', filterStudents);
    document.getElementById('ageFromFilter').addEventListener('input', debounce(filterStudents, 300));
    document.getElementById('ageToFilter').addEventListener('input', debounce(filterStudents, 300));
    
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

async function loadStudents() {
    try {
        showLoading(true);
        
        // Get current filter parameters
        const params = getCurrentFilterParams();
        params.page = currentPage;
        params.limit = studentsPerPage;
        
        const response = await apiClient.getStudents(params);
        
        if (response.success) {
            allStudents = response.data.students;
            filteredStudents = [...allStudents];
            
            updateDisplay();
            updatePagination(response.data.pagination);
            updateStats();
        } else {
            throw new Error(response.message || 'Failed to load students');
        }
        
    } catch (error) {
        handleAPIError(error, 'Failed to load students');
        // Fallback to empty state
        allStudents = [];
        filteredStudents = [];
        updateDisplay();
    } finally {
        showLoading(false);
    }
}

function getCurrentFilterParams() {
    return {
        search: document.getElementById('searchInput').value.trim(),
        course: document.getElementById('courseFilter').value,
        year: document.getElementById('yearFilter').value,
        gender: document.getElementById('genderFilter').value,
        semester: document.getElementById('semesterFilter').value,
        // Add date range and age filters if needed
    };
}

async function updateStats() {
    try {
        const response = await apiClient.getStudentStats();
        
        if (response.success) {
            const stats = response.data;
            document.getElementById('totalStudents').textContent = stats.total_students || 0;
            document.getElementById('totalCourses').textContent = stats.total_courses || 0;
            
            // Find most recent registration
            if (stats.recent_registrations && stats.recent_registrations.length > 0) {
                const latest = stats.recent_registrations[0];
                document.getElementById('newestStudent').textContent = latest.date;
            } else {
                document.getElementById('newestStudent').textContent = '-';
            }
        }
    } catch (error) {
        console.warn('Failed to load statistics:', error);
        // Set default values
        document.getElementById('totalStudents').textContent = allStudents.length;
        document.getElementById('totalCourses').textContent = new Set(allStudents.map(s => s.course)).size;
        document.getElementById('newestStudent').textContent = '-';
    }
}

function updateDisplay() {
    updateTable();
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
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add student rows
    filteredStudents.forEach(student => {
        const row = createStudentRow(student);
        tableBody.appendChild(row);
    });
    
    // Update bulk action controls
    updateBulkActions();
}

function createStudentRow(student) {
    const row = document.createElement('tr');
    
    const registrationDate = new Date(student.registration_date).toLocaleDateString();
    const fullName = `${student.first_name} ${student.last_name}`;
    
    row.innerHTML = `
        <td><input type="checkbox" class="student-checkbox" value="${student.id}" onchange="updateBulkActions()"></td>
        <td>${student.student_id || 'N/A'}</td>
        <td>${fullName}</td>
        <td>${student.email}</td>
        <td>${student.course}</td>
        <td>${student.academic_year}</td>
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

function updatePagination(pagination) {
    const prevBtn = document.getElementById('prevPage');
    const nextBtn = document.getElementById('nextPage');
    const pageInfo = document.getElementById('pageInfo');
    
    if (pagination) {
        prevBtn.disabled = !pagination.has_prev;
        nextBtn.disabled = !pagination.has_next;
        pageInfo.textContent = `Page ${pagination.current_page} of ${pagination.total_pages}`;
        currentPage = pagination.current_page;
    } else {
        prevBtn.disabled = true;
        nextBtn.disabled = true;
        pageInfo.textContent = 'Page 1 of 1';
    }
}

function filterStudents() {
    currentPage = 1; // Reset to first page
    loadStudents(); // Reload with new filters
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
    
    currentPage = 1;
    loadStudents();
}

function changePage(direction) {
    const newPage = currentPage + direction;
    if (newPage >= 1) {
        currentPage = newPage;
        loadStudents();
    }
}

async function viewStudent(studentId) {
    try {
        const response = await apiClient.getStudent(studentId);
        
        if (response.success) {
            const student = response.data;
            currentStudentId = studentId;
            
            const modalBody = document.getElementById('studentDetails');
            modalBody.innerHTML = `
                <div class="detail-section">
                    <h4>Personal Information</h4>
                    <div class="detail-group">
                        <label>Full Name:</label>
                        <span>${student.first_name} ${student.last_name}</span>
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
                        <span>${new Date(student.date_of_birth).toLocaleDateString()}</span>
                    </div>
                    <div class="detail-group">
                        <label>Age:</label>
                        <span>${student.age || 'N/A'} years</span>
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
                        <span>${student.student_id || 'Auto-generated'}</span>
                    </div>
                    <div class="detail-group">
                        <label>Course/Program:</label>
                        <span>${student.course}</span>
                    </div>
                    <div class="detail-group">
                        <label>Academic Year:</label>
                        <span>${student.academic_year}</span>
                    </div>
                    <div class="detail-group">
                        <label>Semester:</label>
                        <span>${student.semester}</span>
                    </div>
                    <div class="detail-group">
                        <label>Status:</label>
                        <span>${student.status || 'Active'}</span>
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
                        <span>${student.zip_code || 'Not provided'}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4>Registration Details</h4>
                    <div class="detail-group">
                        <label>Registration Date:</label>
                        <span>${new Date(student.registration_date).toLocaleString()}</span>
                    </div>
                    <div class="detail-group">
                        <label>Last Modified:</label>
                        <span>${student.last_modified ? new Date(student.last_modified).toLocaleString() : 'Never'}</span>
                    </div>
                </div>
            `;
            
            document.getElementById('studentModal').style.display = 'flex';
        } else {
            throw new Error(response.message || 'Failed to load student details');
        }
        
    } catch (error) {
        handleAPIError(error, 'Failed to load student details');
    }
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

async function deleteStudent(id) {
    if (confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
        try {
            const response = await apiClient.deleteStudent(id);
            
            if (response.success) {
                showNotification('Student deleted successfully', 'success');
                
                // Close modal if it's open for this student
                if (currentStudentId === id) {
                    closeModal();
                }
                
                // Reload students
                loadStudents();
            } else {
                throw new Error(response.message || 'Failed to delete student');
            }
            
        } catch (error) {
            handleAPIError(error, 'Failed to delete student');
        }
    }
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
    if (bulkDeleteBtn) {
        bulkDeleteBtn.disabled = selectedCheckboxes.length === 0;
        bulkDeleteBtn.textContent = `Delete Selected (${selectedCheckboxes.length})`;
    }
    
    // Update header checkbox state
    if (headerCheckbox) {
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
}

async function bulkDeleteStudents() {
    const selectedCheckboxes = document.querySelectorAll('.student-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(cb => parseInt(cb.value));
    
    if (selectedIds.length === 0) return;
    
    const confirmMessage = `Are you sure you want to delete ${selectedIds.length} student(s)? This action cannot be undone.`;
    
    if (confirm(confirmMessage)) {
        try {
            const response = await apiClient.bulkDeleteStudents(selectedIds);
            
            if (response.success) {
                showNotification(`${response.data.deleted_count} student(s) deleted successfully`, 'success');
                loadStudents();
            } else {
                throw new Error(response.message || 'Failed to delete students');
            }
            
        } catch (error) {
            handleAPIError(error, 'Failed to delete students');
        }
    }
}

// Export Functions
async function exportToCSV() {
    try {
        // Get all students with current filters
        const params = getCurrentFilterParams();
        params.limit = 1000; // Get more records for export
        
        const response = await apiClient.getStudents(params);
        
        if (!response.success || response.data.students.length === 0) {
            showNotification('No students to export', 'error');
            return;
        }
        
        const students = response.data.students;
        
        const headers = [
            'Student ID', 'First Name', 'Last Name', 'Email', 'Phone', 
            'Date of Birth', 'Gender', 'Course', 'Academic Year', 'Semester',
            'Address', 'City', 'State', 'ZIP Code', 'Registration Date'
        ];
        
        const csvContent = [
            headers.join(','),
            ...students.map(student => [
                student.student_id || '',
                student.first_name || '',
                student.last_name || '',
                student.email || '',
                student.phone || '',
                student.date_of_birth || '',
                student.gender || '',
                student.course || '',
                student.academic_year || '',
                student.semester || '',
                student.address || '',
                student.city || '',
                student.state || '',
                student.zip_code || '',
                new Date(student.registration_date).toLocaleDateString()
            ].map(field => `"${field}"`).join(','))
        ].join('\n');
        
        downloadFile(csvContent, 'students.csv', 'text/csv');
        showNotification(`Exported ${students.length} students to CSV`, 'success');
        
    } catch (error) {
        handleAPIError(error, 'Failed to export students');
    }
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

// Advanced Search
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

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showLoading(show) {
    // You can implement a loading spinner here
    const loadingElement = document.getElementById('loading');
    if (loadingElement) {
        loadingElement.style.display = show ? 'block' : 'none';
    }
}
