/**
 * API Client for Student Registration System
 * Handles communication with PHP backend
 */

// Set the API base URL for all requests
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3001/api/';

class APIClient {
    constructor() {
        this.baseURL = API_BASE_URL;
        this.sessionToken = localStorage.getItem('session_token');
    }

    /**
     * Make HTTP request to API
     */
    async request(endpoint, options = {}) {
        const url = this.baseURL + endpoint;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        // Add authorization header if we have a session token
        if (this.sessionToken) {
            defaultOptions.headers['Authorization'] = `Bearer ${this.sessionToken}`;
        }

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    /**
     * GET request
     */
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        
        return this.request(url, {
            method: 'GET'
        });
    }

    /**
     * POST request
     */
    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * PUT request
     */
    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    /**
     * DELETE request
     */
    async delete(endpoint) {
        return this.request(endpoint, {
            method: 'DELETE'
        });
    }

    /**
     * Set session token
     */
    setSessionToken(token) {
        this.sessionToken = token;
        if (token) {
            localStorage.setItem('session_token', token);
        } else {
            localStorage.removeItem('session_token');
        }
    }

    /**
     * Get session token
     */
    getSessionToken() {
        return this.sessionToken;
    }



    // Student API methods
    async getStudents(params = {}) {
        return this.get('students', params);
    }

    async getStudent(id) {
        return this.get(`students/${id}`);
    }

    async createStudent(studentData) {
        return this.post('students', studentData);
    }

    async updateStudent(id, studentData) {
        return this.put(`students/${id}`, studentData);
    }

    async deleteStudent(id) {
        return this.delete(`students/${id}`);
    }

    async bulkDeleteStudents(ids) {
        return this.delete('students?bulk=1', {
            body: JSON.stringify({ ids })
        });
    }

    async getStudentStats() {
        return this.get('students?stats=1');
    }

    /**
     * Check if an email is already registered (returns true/false)
     * Usage: await apiClient.isEmailRegistered(email)
     */
    async isEmailRegistered(email) {
        try {
            // Assumes backend GET /students?email=... returns an array of students
            const result = await this.get('students', { email });
            if (Array.isArray(result.data)) {
                return result.data.length > 0;
            }
            // fallback: if data is not array, treat as not registered
            return false;
        } catch (error) {
            // If 404 or not found, treat as not registered
            if (error.message && error.message.includes('404')) {
                return false;
            }
            // Otherwise, rethrow for UI to handle
            throw error;
        }
    }

    /**
     * Check if an email is already registered
     * Returns true if exists, false if not
     */
    async isEmailRegistered(email) {
        try {
            const result = await this.getStudents({ email });
            // If any student is returned, email is taken
            return Array.isArray(result.data) && result.data.length > 0;
        } catch (error) {
            // If 404 or no students, treat as not registered
            return false;
        }
    }

    // Authentication API methods
    async login(username, password) {
        const response = await this.post('auth/login', { username, password });
        if (response.success && response.data.session_token) {
            this.setSessionToken(response.data.session_token);
        }
        return response;
    }

    async logout() {
        const response = await this.post('auth/logout');
        this.setSessionToken(null);
        return response;
    }

    async checkAuth() {
        return this.get('auth/check');
    }

    async getProfile() {
        return this.get('auth/profile');
    }

    // Settings API methods
    async getSettings() {
        return this.get('settings');
    }

    async updateSettings(settings) {
        return this.put('settings', settings);
    }

    // Test API methods
    async runTests() {
        return this.get('test');
    }
}

// Create global API client instance
const apiClient = new APIClient();

/**
 * Show notification to user
 */
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
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
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

/**
 * Handle API errors with user-friendly messages
 */
function handleAPIError(error, defaultMessage = 'An error occurred') {
    console.error('API Error:', error);
    let message = defaultMessage;
    if (error.message) {
        // Friendly error for duplicate email
        if (error.message.includes('students_email_key')) {
            message = 'This email address is already registered.';
        } else if (error.message.includes('students_student_id_key')) {
            message = 'This student ID is already registered.';
        } else if (error.message.includes('duplicate key value')) {
            message = 'Duplicate entry. Please use unique values.';
        } else {
            message = error.message;
        }
    }
    // Handle specific error types
    if (message.includes('401') || message.includes('Not authenticated')) {
        message = 'Please log in to continue';
        // window.location.href = 'login.html';
    } else if (message.includes('403')) {
        message = 'You do not have permission to perform this action';
    } else if (message.includes('404')) {
        message = 'The requested resource was not found';
    } else if (message.includes('500')) {
        message = 'Server error. Please try again later.';
    }
    showNotification(message, 'error');
}

/**
 * Test API connection
 */
async function testAPIConnection() {
    try {
        // Use the /ping endpoint which is defined in the backend
        const response = await apiClient.get('ping');
        console.log('API Connection successful:', response);
        return true;
    } catch (error) {
        console.error('API Connection failed:', error);
        return false;
    }
}

/**
 * Initialize API client
 */
function initializeAPI() {
    // Test API connection on page load
    testAPIConnection().then(connected => {
        if (connected) {
            console.log('✅ API client initialized successfully');
        } else {
            console.warn('⚠️ API connection failed - falling back to localStorage');
            showNotification('Backend connection failed. Using offline mode.', 'warning');
        }
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAPI);
} else {
    initializeAPI();
}
