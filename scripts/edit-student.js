// Edit Student Page JavaScript
let currentStudent = null;
let originalStudentData = null;

document.addEventListener('DOMContentLoaded', function() {
    loadStudentData();
    setupEditFormListeners();
});

function setupEditFormListeners() {
    const form = document.getElementById('editForm');
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            updateStudent();
        }
    });
    
    // Real-time validation for each field
    const fields = ['firstName', 'lastName', 'email', 'dob', 'gender', 'course', 'year', 'semester'];
    
    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldName));
            field.addEventListener('input', () => clearError(fieldName));
        }
    });
    
    // Phone number formatting
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }
    
    // Reset button handler
    const resetButton = form.querySelector('button[type="reset"]');
    resetButton.addEventListener('click', function(e) {
        e.preventDefault();
        resetToOriginal();
    });
}

async function loadStudentData() {
    // Get student ID from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const studentId = urlParams.get('id');
    
    if (!studentId) {
        showError('No student ID provided');
        return;
    }
    
    // Replace localStorage loading with backend API
    try {
        currentStudent = await apiClient.getStudent(studentId);
        if (!currentStudent) {
            showError('Student not found');
            return;
        }
        // Store original data for reset functionality
        originalStudentData = { ...currentStudent };
        
        // Populate form with student data
        populateForm(currentStudent);
        
        // Hide loading message and show form
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('editForm').style.display = 'block';
    } catch (err) {
        showError('Student not found');
    }
}

function populateForm(student) {
    // Personal Information
    document.getElementById('firstName').value = student.firstName || '';
    document.getElementById('lastName').value = student.lastName || '';
    document.getElementById('email').value = student.email || '';
    document.getElementById('phone').value = student.phone || '';
    document.getElementById('dob').value = student.dob || '';
    document.getElementById('gender').value = student.gender || '';
    
    // Academic Information
    document.getElementById('studentId').value = student.studentId || '';
    document.getElementById('course').value = student.course || '';
    document.getElementById('year').value = student.year || '';
    document.getElementById('semester').value = student.semester || '';
    
    // Address Information
    document.getElementById('address').value = student.address || '';
    document.getElementById('city').value = student.city || '';
    document.getElementById('state').value = student.state || '';
    document.getElementById('zipCode').value = student.zipCode || '';
    
    // Registration Details
    const registrationDate = new Date(student.registrationDate).toLocaleString();
    document.getElementById('registrationDate').textContent = registrationDate;
    
    const lastModified = student.lastModified ? 
        new Date(student.lastModified).toLocaleString() : 
        'Never modified';
    document.getElementById('lastModified').textContent = lastModified;
}

async function updateStudent() {
    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    const updatedData = {};
    
    // Collect form data
    for (let [key, value] of formData.entries()) {
        updatedData[key] = value;
    }
    
    // Preserve original data that shouldn't change
    updatedData.registrationDate = currentStudent.registrationDate;
    updatedData.lastModified = new Date().toISOString();
    
    // Replace update logic with backend API
    try {
        await apiClient.updateStudent(currentStudent.id, updatedData);
        showNotification('Student information updated successfully! Redirecting...', 'success');
        setTimeout(() => {
            window.location.href = 'view-students.html';
        }, 2000);
    } catch (err) {
        showNotification('Failed to update student: ' + (err.message || err), 'error');
    }
}

function resetToOriginal() {
    if (originalStudentData) {
        populateForm(originalStudentData);
        
        // Clear all error messages
        const errorElements = document.querySelectorAll('.error-message');
        errorElements.forEach(element => {
            element.textContent = '';
            element.style.display = 'none';
        });
        
        // Remove error classes
        const fields = document.querySelectorAll('.error');
        fields.forEach(field => field.classList.remove('error'));
        
        showNotification('Form reset to original values', 'info');
    }
}

function cancelEdit() {
    if (hasUnsavedChanges()) {
        if (confirm('You have unsaved changes. Are you sure you want to cancel?')) {
            window.location.href = 'view-students.html';
        }
    } else {
        window.location.href = 'view-students.html';
    }
}

function hasUnsavedChanges() {
    if (!originalStudentData) return false;
    
    const form = document.getElementById('editForm');
    const formData = new FormData(form);
    
    // Check if any field has changed
    for (let [key, value] of formData.entries()) {
        if (originalStudentData[key] !== value) {
            return true;
        }
    }
    
    return false;
}

function showError(message) {
    document.getElementById('loadingMessage').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'block';
    
    const errorContainer = document.getElementById('errorMessage');
    errorContainer.querySelector('p').textContent = message;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Style the notification
    const bgColor = type === 'success' ? '#d4edda' : 
                   type === 'error' ? '#f8d7da' : 
                   '#d1ecf1';
    const textColor = type === 'success' ? '#155724' : 
                     type === 'error' ? '#721c24' : 
                     '#0c5460';
    const borderColor = type === 'success' ? '#c3e6cb' : 
                       type === 'error' ? '#f5c6cb' : 
                       '#bee5eb';
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        background: ${bgColor};
        color: ${textColor};
        border: 1px solid ${borderColor};
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 1001;
        transition: all 0.3s ease;
        max-width: 300px;
        font-weight: 500;
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

// Warn user about unsaved changes when leaving the page
window.addEventListener('beforeunload', function(e) {
    if (hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});

// Format phone number function (reused from validation.js)
function formatPhoneNumber(e) {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length >= 12) {
        value = `(${value.slice(0, 3)})${value.slice(3, 6)}-${value.slice(6, 9)}-${value.slice(9, 12)}`;
    } else if (value.length >= 9) {
        value = `(${value.slice(0, 3)})${value.slice(3, 6)}-${value.slice(6, 9)}-${value.slice(9)}`;
    } else if (value.length >= 6) {
        value = `(${value.slice(0, 3)})${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)})${value.slice(3)}`;
    }

    e.target.value = value;
}
