<?php
/**
 * Test API Endpoint
 * For testing database connection and API functionality
 */

// Ensure this file is only accessed through the API router
if (!defined('APP_ROOT')) {
    http_response_code(403);
    exit('Direct access forbidden');
}

switch ($method) {
    case 'GET':
        runTests();
        break;
        
    default:
        sendErrorResponse('Method not allowed', 405);
}

/**
 * Run system tests
 */
function runTests() {
    $tests = [];
    
    // Test 1: Database Connection
    try {
        $db = getDatabase();
        $connection_test = $db->testConnection();
        $tests['database_connection'] = [
            'status' => $connection_test ? 'PASS' : 'FAIL',
            'message' => $connection_test ? 'Database connection successful' : 'Database connection failed'
        ];
        
        if ($connection_test) {
            $db_info = $db->getDatabaseInfo();
            $tests['database_info'] = [
                'status' => 'INFO',
                'data' => $db_info
            ];
        }
    } catch (Exception $e) {
        $tests['database_connection'] = [
            'status' => 'FAIL',
            'message' => 'Database connection error: ' . $e->getMessage()
        ];
    }
    
    // Test 2: Database Schema
    try {
        $tables = fetchAll("SHOW TABLES");
        $required_tables = ['students', 'admin_users', 'user_sessions', 'audit_log', 'system_settings'];
        $existing_tables = array_column($tables, 'Tables_in_student_registration_system');
        
        $missing_tables = array_diff($required_tables, $existing_tables);
        
        $tests['database_schema'] = [
            'status' => empty($missing_tables) ? 'PASS' : 'FAIL',
            'message' => empty($missing_tables) ? 'All required tables exist' : 'Missing tables: ' . implode(', ', $missing_tables),
            'existing_tables' => $existing_tables
        ];
    } catch (Exception $e) {
        $tests['database_schema'] = [
            'status' => 'FAIL',
            'message' => 'Schema check error: ' . $e->getMessage()
        ];
    }
    
    // Test 3: Sample Data
    try {
        $student_count = fetchOne("SELECT COUNT(*) as count FROM students")['count'];
        $admin_count = fetchOne("SELECT COUNT(*) as count FROM admin_users")['count'];
        
        $tests['sample_data'] = [
            'status' => 'INFO',
            'data' => [
                'students' => $student_count,
                'admin_users' => $admin_count
            ]
        ];
    } catch (Exception $e) {
        $tests['sample_data'] = [
            'status' => 'FAIL',
            'message' => 'Data check error: ' . $e->getMessage()
        ];
    }
    
    // Test 4: File Permissions
    $directories = [
        APP_ROOT . '/logs/' => 'Log directory',
        APP_ROOT . '/uploads/' => 'Upload directory',
        APP_ROOT . '/temp/' => 'Temporary directory'
    ];
    
    $permission_tests = [];
    foreach ($directories as $dir => $description) {
        $writable = is_dir($dir) && is_writable($dir);
        $permission_tests[] = [
            'directory' => $dir,
            'description' => $description,
            'writable' => $writable,
            'status' => $writable ? 'PASS' : 'FAIL'
        ];
    }
    
    $tests['file_permissions'] = [
        'status' => 'INFO',
        'data' => $permission_tests
    ];
    
    // Test 5: PHP Configuration
    $php_tests = [
        'PHP Version' => [
            'value' => PHP_VERSION,
            'status' => version_compare(PHP_VERSION, '7.4.0', '>=') ? 'PASS' : 'FAIL'
        ],
        'PDO Extension' => [
            'value' => extension_loaded('pdo') ? 'Loaded' : 'Not loaded',
            'status' => extension_loaded('pdo') ? 'PASS' : 'FAIL'
        ],
        'PDO MySQL' => [
            'value' => extension_loaded('pdo_mysql') ? 'Loaded' : 'Not loaded',
            'status' => extension_loaded('pdo_mysql') ? 'PASS' : 'FAIL'
        ],
        'JSON Extension' => [
            'value' => extension_loaded('json') ? 'Loaded' : 'Not loaded',
            'status' => extension_loaded('json') ? 'PASS' : 'FAIL'
        ],
        'Session Support' => [
            'value' => function_exists('session_start') ? 'Available' : 'Not available',
            'status' => function_exists('session_start') ? 'PASS' : 'FAIL'
        ]
    ];
    
    $tests['php_configuration'] = [
        'status' => 'INFO',
        'data' => $php_tests
    ];
    
    // Test 6: API Endpoints
    $api_tests = [
        'Students API' => file_exists(APP_ROOT . '/api/students.php'),
        'Auth API' => file_exists(APP_ROOT . '/api/auth.php'),
        'Settings API' => file_exists(APP_ROOT . '/api/settings.php')
    ];
    
    $tests['api_endpoints'] = [
        'status' => 'INFO',
        'data' => $api_tests
    ];
    
    // Test 7: Configuration
    $config_tests = [
        'APP_ROOT defined' => defined('APP_ROOT'),
        'Database config' => class_exists('Database'),
        'Error reporting' => error_reporting() !== 0,
        'Timezone set' => date_default_timezone_get() !== false
    ];
    
    $tests['configuration'] = [
        'status' => 'INFO',
        'data' => $config_tests
    ];
    
    // Overall status
    $failed_tests = 0;
    foreach ($tests as $test) {
        if (isset($test['status']) && $test['status'] === 'FAIL') {
            $failed_tests++;
        }
    }
    
    $overall_status = $failed_tests === 0 ? 'PASS' : 'FAIL';
    
    sendSuccessResponse([
        'overall_status' => $overall_status,
        'failed_tests' => $failed_tests,
        'total_tests' => count($tests),
        'tests' => $tests,
        'timestamp' => date('Y-m-d H:i:s'),
        'server_info' => [
            'php_version' => PHP_VERSION,
            'server_software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'
        ]
    ]);
}
?>
