<?php
/**
 * Main Configuration File for Student Registration System
 * WAMP/Windows Local Development Setup
 */

// Prevent direct access
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(dirname(__FILE__)));
}

// Error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('log_errors', 1);
ini_set('error_log', APP_ROOT . '/logs/error.log');

// Timezone
date_default_timezone_set('Africa/Douala');

// Application Configuration
define('APP_NAME', 'Student Registration System');
define('APP_VERSION', '1.0.0');
define('APP_ENV', 'development'); // development, production

// URL Configuration (adjust for your WAMP setup)
define('BASE_URL', 'http://localhost/student-registration-system/');
define('API_URL', BASE_URL . 'backend/api/');
define('ADMIN_URL', BASE_URL . 'backend/admin/');

// File Paths
define('UPLOAD_PATH', APP_ROOT . '/uploads/');
define('LOG_PATH', APP_ROOT . '/logs/');
define('TEMP_PATH', APP_ROOT . '/temp/');

// Security Configuration
define('SECRET_KEY', 'your-secret-key-change-this-in-production');
define('SESSION_LIFETIME', 3600); // 1 hour
define('PASSWORD_MIN_LENGTH', 6);
define('MAX_LOGIN_ATTEMPTS', 5);
define('LOGIN_LOCKOUT_TIME', 900); // 15 minutes

// Database Configuration (imported from database.php)
require_once APP_ROOT . '/config/database.php';

// Email Configuration (for future use)
define('SMTP_HOST', 'localhost');
define('SMTP_PORT', 587);
define('SMTP_USERNAME', '');
define('SMTP_PASSWORD', '');
define('FROM_EMAIL', 'noreply@school.edu');
define('FROM_NAME', 'Student Registration System');

// File Upload Configuration
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx']);

// Pagination Configuration
define('DEFAULT_PAGE_SIZE', 10);
define('MAX_PAGE_SIZE', 100);

// Student ID Configuration
define('STUDENT_ID_PREFIX', 'STU2025');
define('STUDENT_ID_LENGTH', 4); // Number of digits after prefix

// Phone Number Configuration
define('PHONE_FORMAT', '(237)690-000-000');
define('PHONE_REGEX', '/^\([0-9]{3}\)[0-9]{3}-[0-9]{3}-[0-9]{3}$/');

// Validation Rules
$validation_rules = [
    'name' => [
        'min_length' => 2,
        'max_length' => 50,
        'pattern' => '/^[a-zA-Z\s\'-]+$/'
    ],
    'email' => [
        'max_length' => 100,
        'pattern' => '/^[^\s@]+@[^\s@]+\.[^\s@]+$/'
    ],
    'age' => [
        'min' => 16,
        'max' => 100
    ],
    'student_id' => [
        'pattern' => '/^STU2025[0-9]{4}$/'
    ]
];

// System Settings (can be overridden by database settings)
$default_settings = [
    'school_name' => 'University of Excellence',
    'academic_year' => '2024-2025',
    'registration_enabled' => true,
    'email_notifications' => true,
    'max_students_per_course' => 100,
    'default_semester' => 'Fall'
];

/**
 * Autoloader for classes
 */
spl_autoload_register(function ($class_name) {
    $directories = [
        APP_ROOT . '/classes/',
        APP_ROOT . '/models/',
        APP_ROOT . '/controllers/',
        APP_ROOT . '/utils/'
    ];
    
    foreach ($directories as $directory) {
        $file = $directory . $class_name . '.php';
        if (file_exists($file)) {
            require_once $file;
            return;
        }
    }
});

/**
 * Create necessary directories
 */
function createDirectories() {
    $directories = [
        UPLOAD_PATH,
        LOG_PATH,
        TEMP_PATH,
        APP_ROOT . '/sessions/'
    ];
    
    foreach ($directories as $dir) {
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }
}

/**
 * Initialize application
 */
function initializeApp() {
    // Create directories
    createDirectories();
    
    // Start session
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    // Set error handler
    set_error_handler('customErrorHandler');
    set_exception_handler('customExceptionHandler');
}

/**
 * Custom error handler
 */
function customErrorHandler($severity, $message, $file, $line) {
    if (!(error_reporting() & $severity)) {
        return false;
    }
    
    $error_msg = "Error: [$severity] $message in $file on line $line";
    error_log($error_msg);
    
    if (APP_ENV === 'development') {
        echo "<div style='color: red; padding: 10px; border: 1px solid red; margin: 10px;'>";
        echo "<strong>Error:</strong> $message<br>";
        echo "<strong>File:</strong> $file<br>";
        echo "<strong>Line:</strong> $line";
        echo "</div>";
    }
    
    return true;
}

/**
 * Custom exception handler
 */
function customExceptionHandler($exception) {
    $error_msg = "Uncaught exception: " . $exception->getMessage() . 
                 " in " . $exception->getFile() . 
                 " on line " . $exception->getLine();
    error_log($error_msg);
    
    if (APP_ENV === 'development') {
        echo "<div style='color: red; padding: 10px; border: 1px solid red; margin: 10px;'>";
        echo "<strong>Exception:</strong> " . $exception->getMessage() . "<br>";
        echo "<strong>File:</strong> " . $exception->getFile() . "<br>";
        echo "<strong>Line:</strong> " . $exception->getLine() . "<br>";
        echo "<strong>Trace:</strong><pre>" . $exception->getTraceAsString() . "</pre>";
        echo "</div>";
    } else {
        echo "An error occurred. Please try again later.";
    }
}

/**
 * Get system setting
 */
function getSetting($key, $default = null) {
    global $default_settings;
    
    try {
        $setting = fetchOne(
            "SELECT setting_value FROM system_settings WHERE setting_key = ?",
            [$key]
        );
        
        if ($setting) {
            return $setting['setting_value'];
        }
    } catch (Exception $e) {
        // Database not available, use default
    }
    
    return $default ?? ($default_settings[$key] ?? null);
}

/**
 * Set system setting
 */
function setSetting($key, $value, $user_id = null) {
    try {
        $sql = "INSERT INTO system_settings (setting_key, setting_value, updated_by) 
                VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE 
                setting_value = VALUES(setting_value), 
                updated_by = VALUES(updated_by)";
        
        return executeQuery($sql, [$key, $value, $user_id]);
    } catch (Exception $e) {
        error_log("Failed to set setting $key: " . $e->getMessage());
        return false;
    }
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    if (is_array($input)) {
        return array_map('sanitizeInput', $input);
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate phone number
 */
function isValidPhone($phone) {
    return preg_match(PHONE_REGEX, $phone);
}

/**
 * Generate student ID
 */
function generateStudentId() {
    try {
        $sql = "CALL GetNextStudentId(@next_id)";
        executeQuery($sql);
        
        $result = fetchOne("SELECT @next_id as next_id");
        return $result['next_id'];
    } catch (Exception $e) {
        error_log("Failed to generate student ID: " . $e->getMessage());
        return null;
    }
}

/**
 * Log activity
 */
function logActivity($user_id, $action, $table_name, $record_id = null, $old_values = null, $new_values = null) {
    try {
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? null;
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? null;
        
        $sql = "CALL LogAuditEvent(?, ?, ?, ?, ?, ?, ?, ?)";
        executeQuery($sql, [
            $user_id, $action, $table_name, $record_id,
            $old_values ? json_encode($old_values) : null,
            $new_values ? json_encode($new_values) : null,
            $ip_address, $user_agent
        ]);
    } catch (Exception $e) {
        error_log("Failed to log activity: " . $e->getMessage());
    }
}

/**
 * Send JSON response
 */
function sendJsonResponse($data, $status_code = 200) {
    http_response_code($status_code);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Send error response
 */
function sendErrorResponse($message, $status_code = 400, $details = null) {
    $response = ['error' => $message];
    if ($details && APP_ENV === 'development') {
        $response['details'] = $details;
    }
    sendJsonResponse($response, $status_code);
}

/**
 * Send success response
 */
function sendSuccessResponse($data = null, $message = 'Success') {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJsonResponse($response);
}

// Initialize the application
initializeApp();
?>
