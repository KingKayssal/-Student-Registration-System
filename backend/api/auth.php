<?php
/**
 * Authentication API Endpoint
 * Handles login, logout, and session management
 */

// Ensure this file is only accessed through the API router
if (!defined('APP_ROOT')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

// Route based on the second segment
$action = isset($segments[1]) ? $segments[1] : '';

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            login($input);
        } elseif ($action === 'logout') {
            logout();
        } elseif ($action === 'register') {
            registerAdmin($input);
        } else {
            sendErrorResponse('Invalid auth action', 400);
        }
        break;
        
    case 'GET':
        if ($action === 'check') {
            checkAuth();
        } elseif ($action === 'profile') {
            getProfile();
        } else {
            sendErrorResponse('Invalid auth action', 400);
        }
        break;
        
    default:
        sendErrorResponse('Method not allowed', 405);
}

/**
 * Login user
 */
function login($data) {
    try {
        // Validate input
        if (empty($data['username']) || empty($data['password'])) {
            sendErrorResponse('Username and password are required', 400);
        }
        
        $username = sanitizeInput($data['username']);
        $password = $data['password'];
        
        // Check for too many failed attempts
        $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
        $failed_attempts = getFailedLoginAttempts($username, $ip_address);
        
        if ($failed_attempts >= MAX_LOGIN_ATTEMPTS) {
            sendErrorResponse('Too many failed login attempts. Please try again later.', 429);
        }
        
        // Get user from database
        $sql = "SELECT id, username, email, password_hash, full_name, role, is_active 
                FROM admin_users 
                WHERE (username = ? OR email = ?) AND is_active = 1";
        
        $user = fetchOne($sql, [$username, $username]);
        
        if (!$user || !password_verify($password, $user['password_hash'])) {
            // Log failed attempt
            logFailedLoginAttempt($username, $ip_address);
            sendErrorResponse('Invalid username or password', 401);
        }
        
        // Clear failed attempts on successful login
        clearFailedLoginAttempts($username, $ip_address);
        
        // Create session
        $session_token = createUserSession($user['id']);
        
        // Update last login
        updateRecord("UPDATE admin_users SET last_login = NOW() WHERE id = ?", [$user['id']]);
        
        // Log successful login
        logActivity($user['id'], 'LOGIN', 'admin_users', $user['id']);
        
        // Return user data (excluding password)
        unset($user['password_hash']);
        $user['session_token'] = $session_token;
        
        sendSuccessResponse($user, 'Login successful');
        
    } catch (Exception $e) {
        sendErrorResponse('Login failed', 500, $e->getMessage());
    }
}

/**
 * Logout user
 */
function logout() {
    try {
        $session_token = getSessionToken();
        
        if ($session_token) {
            // Get user ID from session
            $session = fetchOne("SELECT user_id FROM user_sessions WHERE session_token = ?", [$session_token]);
            
            if ($session) {
                // Delete session
                updateRecord("DELETE FROM user_sessions WHERE session_token = ?", [$session_token]);
                
                // Log logout
                logActivity($session['user_id'], 'LOGOUT', 'admin_users', $session['user_id']);
            }
        }
        
        // Clear PHP session
        session_destroy();
        
        sendSuccessResponse(null, 'Logout successful');
        
    } catch (Exception $e) {
        sendErrorResponse('Logout failed', 500, $e->getMessage());
    }
}

/**
 * Check authentication status
 */
function checkAuth() {
    try {
        $user = getCurrentUser();
        
        if ($user) {
            unset($user['password_hash']);
            sendSuccessResponse($user, 'Authenticated');
        } else {
            sendErrorResponse('Not authenticated', 401);
        }
        
    } catch (Exception $e) {
        sendErrorResponse('Authentication check failed', 500, $e->getMessage());
    }
}

/**
 * Get user profile
 */
function getProfile() {
    try {
        $user = getCurrentUser();
        
        if (!$user) {
            sendErrorResponse('Not authenticated', 401);
        }
        
        // Get additional profile data
        $profile = fetchOne("
            SELECT u.*, 
                   (SELECT COUNT(*) FROM audit_log WHERE user_id = u.id) as total_actions,
                   (SELECT MAX(created_at) FROM audit_log WHERE user_id = u.id) as last_action
            FROM admin_users u 
            WHERE u.id = ?", [$user['id']]);
        
        unset($profile['password_hash']);
        
        sendSuccessResponse($profile);
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to get profile', 500, $e->getMessage());
    }
}

/**
 * Register new admin user (restricted)
 */
function registerAdmin($data) {
    try {
        // Check if current user is admin
        $current_user = getCurrentUser();
        if (!$current_user || $current_user['role'] !== 'admin') {
            sendErrorResponse('Admin access required', 403);
        }
        
        // Validate input
        $required_fields = ['username', 'email', 'password', 'full_name'];
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                sendErrorResponse("Field '$field' is required", 400);
            }
        }
        
        $data = sanitizeInput($data);
        
        // Validate email
        if (!isValidEmail($data['email'])) {
            sendErrorResponse('Invalid email format', 400);
        }
        
        // Check if username or email already exists
        $existing = fetchOne("SELECT id FROM admin_users WHERE username = ? OR email = ?", 
                           [$data['username'], $data['email']]);
        if ($existing) {
            sendErrorResponse('Username or email already exists', 400);
        }
        
        // Validate password
        if (strlen($data['password']) < PASSWORD_MIN_LENGTH) {
            sendErrorResponse('Password must be at least ' . PASSWORD_MIN_LENGTH . ' characters', 400);
        }
        
        // Hash password
        $password_hash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        // Insert user
        $sql = "INSERT INTO admin_users (username, email, password_hash, full_name, role) 
                VALUES (?, ?, ?, ?, ?)";
        
        $role = isset($data['role']) && in_array($data['role'], ['admin', 'staff', 'viewer']) 
                ? $data['role'] : 'staff';
        
        $user_id = insertRecord($sql, [
            $data['username'],
            $data['email'],
            $password_hash,
            $data['full_name'],
            $role
        ]);
        
        // Log user creation
        logActivity($current_user['id'], 'CREATE', 'admin_users', $user_id);
        
        sendSuccessResponse(['id' => $user_id], 'Admin user created successfully');
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to create admin user', 500, $e->getMessage());
    }
}

/**
 * Get current authenticated user
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
 * Get session token from request
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

/**
 * Create user session
 */
function createUserSession($user_id) {
    $session_token = bin2hex(random_bytes(32));
    $expires_at = date('Y-m-d H:i:s', time() + SESSION_LIFETIME);
    $ip_address = $_SERVER['REMOTE_ADDR'] ?? '';
    $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
    
    $sql = "INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent) 
            VALUES (?, ?, ?, ?, ?)";
    
    insertRecord($sql, [$user_id, $session_token, $expires_at, $ip_address, $user_agent]);
    
    // Store in PHP session as well
    $_SESSION['session_token'] = $session_token;
    $_SESSION['user_id'] = $user_id;
    
    return $session_token;
}

/**
 * Get failed login attempts
 */
function getFailedLoginAttempts($username, $ip_address) {
    // This would typically be stored in a separate table
    // For now, we'll use a simple session-based approach
    $key = "failed_attempts_" . md5($username . $ip_address);
    $attempts = $_SESSION[$key] ?? [];
    
    // Remove attempts older than lockout time
    $cutoff = time() - LOGIN_LOCKOUT_TIME;
    $attempts = array_filter($attempts, function($timestamp) use ($cutoff) {
        return $timestamp > $cutoff;
    });
    
    $_SESSION[$key] = $attempts;
    
    return count($attempts);
}

/**
 * Log failed login attempt
 */
function logFailedLoginAttempt($username, $ip_address) {
    $key = "failed_attempts_" . md5($username . $ip_address);
    $attempts = $_SESSION[$key] ?? [];
    $attempts[] = time();
    $_SESSION[$key] = $attempts;
}

/**
 * Clear failed login attempts
 */
function clearFailedLoginAttempts($username, $ip_address) {
    $key = "failed_attempts_" . md5($username . $ip_address);
    unset($_SESSION[$key]);
}
?>
