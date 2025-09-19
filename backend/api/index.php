<?php
/**
 * API Router for Student Registration System
 * Handles all API requests and routes them to appropriate endpoints
 */

// Define APP_ROOT if not already defined
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(dirname(__FILE__)));
}

// Include configuration
require_once APP_ROOT . '/config/config.php';

// Set CORS headers for frontend integration
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get request method and path
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// Remove base path to get relative path
$basePath = '/student-registration-system/backend/api';
$relativePath = str_replace($basePath, '', $path);
$relativePath = trim($relativePath, '/');

// Split path into segments
$segments = array_filter(explode('/', $relativePath));

// Route the request
try {
    if (empty($segments)) {
        // API root - return API information
        sendSuccessResponse([
            'name' => APP_NAME . ' API',
            'version' => APP_VERSION,
            'endpoints' => [
                'students' => 'GET, POST /students',
                'student' => 'GET, PUT, DELETE /students/{id}',
                'auth' => 'POST /auth/login, POST /auth/logout',
                'settings' => 'GET /settings'
            ]
        ]);
    }
    
    $endpoint = $segments[0];
    $id = isset($segments[1]) ? $segments[1] : null;
    
    switch ($endpoint) {
        case 'students':
            require_once APP_ROOT . '/api/students.php';
            break;
            
        case 'auth':
            require_once APP_ROOT . '/api/auth.php';
            break;
            
        case 'settings':
            require_once APP_ROOT . '/api/settings.php';
            break;
            
        case 'test':
            require_once APP_ROOT . '/api/test.php';
            break;
            
        default:
            sendErrorResponse('Endpoint not found', 404);
    }
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    sendErrorResponse('Internal server error', 500, $e->getMessage());
}
?>
