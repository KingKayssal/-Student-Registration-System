// Form validation and handling with API integration
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('registrationForm');
    
    // Form submission handler
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (validateForm()) {
            submitStudentForm();
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
    
    // Email uniqueness check removed: allow duplicate emails
    
    // Phone number formatting
    const phoneField = document.getElementById('phone');
    if (phoneField) {
        phoneField.addEventListener('input', formatPhoneNumber);
    }
});

/**
 * Submit student form to API
 */
async function submitStudentForm() {
    try {
        // Show loading state
        const submitButton = document.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Registering...';
        submitButton.disabled = true;
        
        // Collect form data
        const formData = new FormData(document.getElementById('registrationForm'));
        const studentData = {};
        
        for (let [key, value] of formData.entries()) {
            studentData[key] = value;
        }
        
        // Submit to API
        const response = await apiClient.createStudent(studentData);
        
        if (response.success) {
            showNotification('Student registered successfully! Redirecting...', 'success');
            
            // Redirect to view students page after 2 seconds
            setTimeout(() => {
                window.location.href = 'view-students.html';
            }, 2000);
        } else {
            throw new Error(response.message || 'Registration failed');
        }
        
    } catch (error) {
        handleAPIError(error, 'Failed to register student');
        
        // Reset button
        const submitButton = document.querySelector('button[type="submit"]');
        submitButton.textContent = 'Register Student';
        submitButton.disabled = false;
    }
}

// Email uniqueness check function removed: allow duplicate emails

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
