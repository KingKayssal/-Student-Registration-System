// Form validation and handling
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            showSuccessMessage();
        }
    });
    
    // Real-time validation for each field
    const fields = ['firstName', 'lastName', 'email', 'dob', 'gender', 'course', 'year', 'semester'];

    fields.forEach(fieldName => {
        const field = document.getElementById(fieldName);
        if (field) {
            field.addEventListener('blur', () => validateField(fieldName));
            field.addEventListener('input', () => {
                clearError(fieldName);
                // Check field dependencies
                checkFieldDependencies(fieldName);
            });
        }
    });

    // Remove email uniqueness check on registration
    // (No event listener for uniqueness)
    
    // Phone number formatting
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }
});

function validateForm() {
    let isValid = true;
    
    // Required fields validation
    const requiredFields = [
        { id: 'firstName', message: 'First name is required' },
        { id: 'lastName', message: 'Last name is required' },
        { id: 'email', message: 'Email address is required' },
        { id: 'dob', message: 'Date of birth is required' },
        { id: 'gender', message: 'Please select a gender' },
        { id: 'course', message: 'Please select a course' },
        { id: 'year', message: 'Please select academic year' },
        { id: 'semester', message: 'Please select semester' }
    ];
    
    requiredFields.forEach(field => {
        if (!validateField(field.id)) {
            isValid = false;
        }
    });
    
    return isValid;
}

function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + 'Error');
    
    if (!field || !errorElement) return true;
    
    let isValid = true;
    let errorMessage = '';
    
    // Clear previous error
    clearError(fieldName);
    
    switch (fieldName) {
        case 'firstName':
        case 'lastName':
            if (!field.value.trim()) {
                errorMessage = `${fieldName === 'firstName' ? 'First' : 'Last'} name is required`;
                isValid = false;
            } else if (field.value.trim().length < 2) {
                errorMessage = `${fieldName === 'firstName' ? 'First' : 'Last'} name must be at least 2 characters`;
                isValid = false;
            } else if (!/^[a-zA-Z\s'-]+$/.test(field.value.trim())) {
                errorMessage = 'Name can only contain letters, spaces, hyphens, and apostrophes';
                isValid = false;
            }
            break;
            
        case 'email':
            if (!field.value.trim()) {
                errorMessage = 'Email address is required';
                isValid = false;
            } else if (!isValidEmail(field.value.trim())) {
                errorMessage = 'Please enter a valid email address';
                isValid = false;
            }
            // Do NOT check for uniqueness on registration, allow duplicate emails
            break;
            
        case 'phone':
            if (field.value.trim() && !isValidPhone(field.value.trim())) {
                errorMessage = 'Please enter a valid phone number';
                isValid = false;
            }
            break;
            
        case 'dob':
            if (!field.value) {
                errorMessage = 'Date of birth is required';
                isValid = false;
            } else if (!isValidAge(field.value)) {
                const age = calculateAge(field.value);
                if (age < 16) {
                    errorMessage = `Student is too young (${age} years old). Minimum age is 16.`;
                } else if (age > 100) {
                    errorMessage = `Invalid age (${age} years old). Maximum age is 100.`;
                } else {
                    errorMessage = 'Please enter a valid date of birth';
                }
                isValid = false;
            } else if (new Date(field.value) > new Date()) {
                errorMessage = 'Date of birth cannot be in the future';
                isValid = false;
            }
            break;
            
        case 'gender':
        case 'course':
        case 'year':
        case 'semester':
            if (!field.value) {
                errorMessage = `Please select a ${fieldName}`;
                isValid = false;
            }
            break;
    }
    
    if (!isValid) {
        showError(fieldName, errorMessage);
        field.classList.add('error');
    } else {
        field.classList.remove('error');
    }
    
    return isValid;
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidPhone(phone) {
    // Updated regex for format: (237)690-000-000
    const phoneRegex = /^\(([0-9]{3})\)([0-9]{3})-([0-9]{3})-([0-9]{3})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

function isValidAge(dateString) {
    const age = calculateAge(dateString);
    return age >= 16 && age <= 100;
}

function calculateAge(dateString) {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }

    return age;
}

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

function showError(fieldName, message) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
    }
}

function clearError(fieldName) {
    const errorElement = document.getElementById(fieldName + 'Error');
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
    }
}

function showSuccessMessage() {
    const form = document.getElementById('registrationForm');

    // Store form data via backend API (let backend generate studentId)
    const formData = new FormData(form);
    const studentData = {};
    for (let [key, value] of formData.entries()) {
        // Do NOT send studentId to backend on registration page (do not include at all)
        if (key !== 'studentId' && key !== 'student_id') studentData[key] = value;
    }
    // Defensive: Remove empty/undefined/null fields
    Object.keys(studentData).forEach(key => {
        if (studentData[key] === undefined || studentData[key] === null || studentData[key] === '') {
            delete studentData[key];
        }
    });
    apiClient.createStudent(studentData)
        .then((created) => {
            // Defensive: Show generated student_id if present, else generic message
            const sid = created.student_id || (created.data && created.data.student_id) || '';
            showNotification('Student registered successfully!' + (sid ? ' ID: ' + sid : '') + '. Redirecting to student list...', 'success');
            setTimeout(() => {
                window.location.href = 'view-students.html';
            }, 2000);
        })
        .catch(err => {
            // Prefer backend error message if available
            let msg = '';
            if (err && typeof err === 'object') {
                if (err.error) {
                    msg = err.error;
                } else if (err.message) {
                    msg = err.message;
                } else if (err.data && err.data.error) {
                    msg = err.data.error;
                } else {
                    msg = JSON.stringify(err);
                }
            } else {
                msg = err;
            }
            if (msg && msg.includes('students_student_id_key')) {
                msg = 'A student with this ID already exists. Please try again.';
            } else if (msg && msg.includes('duplicate key value')) {
                msg = 'Duplicate entry detected. Please check your data.';
            }
            showNotification('Failed to register student: ' + msg, 'error');
        });
}

function generateStudentId() {
    // Student ID is now generated by the backend
    return '';
}

function resetForm() {
    const form = document.getElementById('registrationForm');
    const successMessage = document.getElementById('successMessage');

    // Reset form
    form.reset();

    // Clear all errors
    const errorElements = document.querySelectorAll('.error-message');
    errorElements.forEach(element => {
        element.textContent = '';
        element.style.display = 'none';
    });

    // Remove error classes
    const fields = document.querySelectorAll('.error');
    fields.forEach(field => field.classList.remove('error'));

    // Show form and hide success message
    form.style.display = 'block';
    successMessage.style.display = 'none';

    // Focus on first field
    const firstField = document.getElementById('firstName');
    if (firstField) {
        firstField.focus();
    }
}

function checkFieldDependencies(fieldName) {
    // Course and year dependency
    if (fieldName === 'course') {
        const courseField = document.getElementById('course');
        const yearField = document.getElementById('year');

        if (courseField.value === 'Graduate') {
            // For graduate programs, only show Graduate option
            Array.from(yearField.options).forEach(option => {
                if (option.value !== 'Graduate' && option.value !== '') {
                    option.style.display = 'none';
                }
            });
            if (yearField.value !== 'Graduate' && yearField.value !== '') {
                yearField.value = 'Graduate';
            }
        } else {
            // For undergraduate programs, hide Graduate option
            Array.from(yearField.options).forEach(option => {
                if (option.value === 'Graduate') {
                    option.style.display = 'none';
                } else {
                    option.style.display = 'block';
                }
            });
            if (yearField.value === 'Graduate') {
                yearField.value = '';
            }
        }
    }

    // Age-based validation for course selection
    if (fieldName === 'dob') {
        const dobField = document.getElementById('dob');
        const courseField = document.getElementById('course');

        if (dobField.value) {
            const age = calculateAge(dobField.value);
            if (age < 18 && courseField.value === 'Medicine') {
                showError('course', 'Students under 18 cannot enroll in Medicine program');
                courseField.value = '';
            }
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
