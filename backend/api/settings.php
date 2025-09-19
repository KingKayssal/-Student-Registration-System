<?php
/**
 * Settings API Endpoint
 * Handles system settings and configuration
 */

// Ensure this file is only accessed through the API router
if (!defined('APP_ROOT')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

switch ($method) {
    case 'GET':
        getSettings();
        break;
        
    case 'POST':
    case 'PUT':
        updateSettings($input);
        break;
        
    default:
        sendErrorResponse('Method not allowed', 405);
}

/**
 * Get all system settings
 */
function getSettings() {
    try {
        // Get all settings from database
        $settings_data = fetchAll("SELECT setting_key, setting_value, description FROM system_settings ORDER BY setting_key");
        
        // Convert to key-value array
        $settings = [];
        foreach ($settings_data as $setting) {
            $settings[$setting['setting_key']] = [
                'value' => $setting['setting_value'],
                'description' => $setting['description']
            ];
        }
        
        // Add some computed settings
        $settings['database_info'] = [
            'value' => getDatabase()->getDatabaseInfo(),
            'description' => 'Database connection information'
        ];
        
        // Get student statistics
        $stats = [
            'total_students' => fetchOne("SELECT COUNT(*) as count FROM students WHERE status = 'Active'")['count'],
            'total_courses' => fetchOne("SELECT COUNT(DISTINCT course) as count FROM students WHERE status = 'Active'")['count'],
            'total_admins' => fetchOne("SELECT COUNT(*) as count FROM admin_users WHERE is_active = 1")['count']
        ];
        
        $settings['statistics'] = [
            'value' => $stats,
            'description' => 'System statistics'
        ];
        
        sendSuccessResponse($settings);
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to fetch settings', 500, $e->getMessage());
    }
}

/**
 * Update system settings
 */
function updateSettings($data) {
    try {
        // Check authentication
        $user = getCurrentUser();
        if (!$user) {
            sendErrorResponse('Authentication required', 401);
        }
        
        // Check permissions (only admin can update settings)
        if ($user['role'] !== 'admin') {
            sendErrorResponse('Admin access required', 403);
        }
        
        if (empty($data) || !is_array($data)) {
            sendErrorResponse('Settings data required', 400);
        }
        
        $updated_count = 0;
        
        // Update each setting
        foreach ($data as $key => $value) {
            // Validate setting key
            if (!isValidSettingKey($key)) {
                continue; // Skip invalid keys
            }
            
            // Sanitize value
            $sanitized_value = sanitizeInput($value);
            
            // Update or insert setting
            $sql = "INSERT INTO system_settings (setting_key, setting_value, updated_by) 
                    VALUES (?, ?, ?) 
                    ON DUPLICATE KEY UPDATE 
                    setting_value = VALUES(setting_value), 
                    updated_by = VALUES(updated_by)";
            
            $result = executeQuery($sql, [$key, $sanitized_value, $user['id']]);
            if ($result) {
                $updated_count++;
            }
        }
        
        // Log the update
        logActivity($user['id'], 'UPDATE', 'system_settings', null, null, $data);
        
        sendSuccessResponse(['updated_count' => $updated_count], 'Settings updated successfully');
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to update settings', 500, $e->getMessage());
    }
}

/**
 * Validate setting key
 */
function isValidSettingKey($key) {
    $allowed_keys = [
        'school_name',
        'academic_year',
        'student_id_prefix',
        'phone_format',
        'default_semester',
        'max_students_per_course',
        'registration_enabled',
        'email_notifications',
        'theme_color',
        'logo_url',
        'contact_email',
        'contact_phone',
        'address',
        'website_url'
    ];
    
    return in_array($key, $allowed_keys);
}

/**
 * Get current user (from auth.php)
 */
function getCurrentUser() {
    $session_token = getSessionToken();
    
    if (!$session_token) {
        return null;
    }
    
    $sql = "SELECT u.*, s.expires_at 
            FROM admin_users u 
            JOIN user_sessions s ON u.id = s.user_id 
            WHERE s.session_token = ? AND s.expires_at > NOW() AND u.is_active = 1";
    
    return fetchOne($sql, [$session_token]);
}

/**
 * Get session token (from auth.php)
 */
function getSessionToken() {
    // Check Authorization header
    $headers = getallheaders();
    if (isset($headers['Authorization'])) {
        $auth_header = $headers['Authorization'];
        if (preg_match('/Bearer\s+(.*)$/i', $auth_header, $matches)) {
            return $matches[1];
        }
    }
    
    // Check session
    return $_SESSION['session_token'] ?? null;
}
?>
