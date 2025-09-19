<?php
/**
 * System Test Page
 */

// Run tests if requested
$test_results = null;
if (isset($_GET['run_tests'])) {
    $test_results = runSystemTests();
}

function runSystemTests() {
    $tests = [];
    
    // Test 1: Database Connection
    try {
        $db = getDatabase();
        $connection_test = $db->testConnection();
        $tests['database_connection'] = [
            'name' => 'Database Connection',
            'status' => $connection_test ? 'PASS' : 'FAIL',
            'message' => $connection_test ? 'Database connection successful' : 'Database connection failed'
        ];
        
        if ($connection_test) {
            $db_info = $db->getDatabaseInfo();
            $tests['database_info'] = [
                'name' => 'Database Information',
                'status' => 'INFO',
                'message' => "Connected to {$db_info['database']} ({$db_info['version']})"
            ];
        }
    } catch (Exception $e) {
        $tests['database_connection'] = [
            'name' => 'Database Connection',
            'status' => 'FAIL',
            'message' => 'Database connection error: ' . $e->getMessage()
        ];
    }
    
    // Test 2: Required Tables
    try {
        $tables = fetchAll("SHOW TABLES");
        $required_tables = ['students', 'admin_users', 'user_sessions', 'audit_log', 'system_settings'];
        $existing_tables = array_column($tables, 'Tables_in_student_registration_system');
        
        $missing_tables = array_diff($required_tables, $existing_tables);
        
        $tests['database_schema'] = [
            'name' => 'Database Schema',
            'status' => empty($missing_tables) ? 'PASS' : 'FAIL',
            'message' => empty($missing_tables) ? 'All required tables exist' : 'Missing tables: ' . implode(', ', $missing_tables)
        ];
    } catch (Exception $e) {
        $tests['database_schema'] = [
            'name' => 'Database Schema',
            'status' => 'FAIL',
            'message' => 'Schema check error: ' . $e->getMessage()
        ];
    }
    
    // Test 3: Sample Data
    try {
        $student_count = fetchOne("SELECT COUNT(*) as count FROM students")['count'];
        $admin_count = fetchOne("SELECT COUNT(*) as count FROM admin_users")['count'];
        
        $tests['sample_data'] = [
            'name' => 'Sample Data',
            'status' => 'INFO',
            'message' => "Students: $student_count, Admin users: $admin_count"
        ];
    } catch (Exception $e) {
        $tests['sample_data'] = [
            'name' => 'Sample Data',
            'status' => 'FAIL',
            'message' => 'Data check error: ' . $e->getMessage()
        ];
    }
    
    // Test 4: API Endpoints
    $api_files = [
        'students.php' => 'Students API',
        'auth.php' => 'Authentication API',
        'settings.php' => 'Settings API',
        'test.php' => 'Test API'
    ];
    
    foreach ($api_files as $file => $name) {
        $file_path = APP_ROOT . '/api/' . $file;
        $tests['api_' . $file] = [
            'name' => $name,
            'status' => file_exists($file_path) ? 'PASS' : 'FAIL',
            'message' => file_exists($file_path) ? 'File exists' : 'File missing: ' . $file_path
        ];
    }
    
    // Test 5: File Permissions
    $directories = [
        APP_ROOT . '/logs/' => 'Log directory',
        APP_ROOT . '/uploads/' => 'Upload directory',
        APP_ROOT . '/temp/' => 'Temporary directory'
    ];
    
    foreach ($directories as $dir => $description) {
        $writable = is_dir($dir) && is_writable($dir);
        $tests['perm_' . basename($dir)] = [
            'name' => $description,
            'status' => $writable ? 'PASS' : 'WARN',
            'message' => $writable ? 'Directory writable' : 'Directory not writable or missing'
        ];
    }
    
    // Test 6: PHP Extensions
    $extensions = [
        'pdo' => 'PDO Extension',
        'pdo_mysql' => 'PDO MySQL Extension',
        'json' => 'JSON Extension',
        'session' => 'Session Support'
    ];
    
    foreach ($extensions as $ext => $name) {
        $loaded = $ext === 'session' ? function_exists('session_start') : extension_loaded($ext);
        $tests['php_' . $ext] = [
            'name' => $name,
            'status' => $loaded ? 'PASS' : 'FAIL',
            'message' => $loaded ? 'Available' : 'Not available'
        ];
    }
    
    return $tests;
}
?>

<h2>🧪 System Tests</h2>

<div class="card">
    <h3>🔍 Test System Components</h3>
    <p>Run comprehensive tests to verify that all system components are working correctly.</p>
    
    <a href="?page=test&run_tests=1" class="btn">🚀 Run All Tests</a>
    <a href="../api/test" class="btn btn-secondary" target="_blank">API Test Endpoint</a>
</div>

<?php if ($test_results): ?>
<div class="card">
    <h3>📊 Test Results</h3>
    
    <?php
    $total_tests = count($test_results);
    $passed_tests = count(array_filter($test_results, function($test) { return $test['status'] === 'PASS'; }));
    $failed_tests = count(array_filter($test_results, function($test) { return $test['status'] === 'FAIL'; }));
    $warnings = count(array_filter($test_results, function($test) { return $test['status'] === 'WARN'; }));
    ?>
    
    <div class="stats" style="margin-bottom: 20px;">
        <div class="stat-card" style="background: linear-gradient(135deg, #28a745, #20c997);">
            <h3><?php echo $passed_tests; ?></h3>
            <p>Passed</p>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #dc3545, #c82333);">
            <h3><?php echo $failed_tests; ?></h3>
            <p>Failed</p>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #ffc107, #e0a800);">
            <h3><?php echo $warnings; ?></h3>
            <p>Warnings</p>
        </div>
        <div class="stat-card">
            <h3><?php echo $total_tests; ?></h3>
            <p>Total Tests</p>
        </div>
    </div>
    
    <table class="table">
        <thead>
            <tr>
                <th>Test</th>
                <th>Status</th>
                <th>Message</th>
            </tr>
        </thead>
        <tbody>
            <?php foreach ($test_results as $test): ?>
            <tr>
                <td><?php echo htmlspecialchars($test['name']); ?></td>
                <td>
                    <?php
                    $color = '';
                    $icon = '';
                    switch ($test['status']) {
                        case 'PASS':
                            $color = 'color: #28a745; font-weight: bold;';
                            $icon = '✅';
                            break;
                        case 'FAIL':
                            $color = 'color: #dc3545; font-weight: bold;';
                            $icon = '❌';
                            break;
                        case 'WARN':
                            $color = 'color: #ffc107; font-weight: bold;';
                            $icon = '⚠️';
                            break;
                        case 'INFO':
                            $color = 'color: #17a2b8; font-weight: bold;';
                            $icon = 'ℹ️';
                            break;
                    }
                    ?>
                    <span style="<?php echo $color; ?>"><?php echo $icon . ' ' . $test['status']; ?></span>
                </td>
                <td><?php echo htmlspecialchars($test['message']); ?></td>
            </tr>
            <?php endforeach; ?>
        </tbody>
    </table>
    
    <?php if ($failed_tests > 0): ?>
    <div class="alert alert-error">
        <strong>⚠️ Some tests failed!</strong> Please check the failed tests above and resolve any issues before using the system in production.
    </div>
    <?php else: ?>
    <div class="alert alert-success">
        <strong>🎉 All critical tests passed!</strong> Your system is ready to use.
    </div>
    <?php endif; ?>
</div>
<?php endif; ?>

<div class="card">
    <h3>🔧 Manual Tests</h3>
    <p>You can also test individual components manually:</p>
    
    <h4>Frontend Tests:</h4>
    <ul>
        <li><a href="../../index.html" target="_blank">Homepage</a> - Check if the main page loads</li>
        <li><a href="../../register.html" target="_blank">Registration Form</a> - Try registering a test student</li>
        <li><a href="../../view-students.html" target="_blank">Student Management</a> - View and manage students</li>
    </ul>
    
    <h4>API Tests:</h4>
    <ul>
        <li><a href="../api/" target="_blank">API Root</a> - Check API information</li>
        <li><a href="../api/test" target="_blank">Test Endpoint</a> - Comprehensive API tests</li>
        <li><a href="../api/students" target="_blank">Students API</a> - Student data endpoint</li>
        <li><a href="../api/settings" target="_blank">Settings API</a> - System settings</li>
    </ul>
    
    <h4>Database Tests:</h4>
    <ul>
        <li><a href="http://localhost/phpmyadmin" target="_blank">phpMyAdmin</a> - Direct database access</li>
        <li>Check if tables exist: students, admin_users, user_sessions, audit_log, system_settings</li>
        <li>Verify sample data is present</li>
    </ul>
</div>

<div class="card">
    <h3>📋 System Information</h3>
    <table class="table">
        <tr>
            <td><strong>PHP Version</strong></td>
            <td><?php echo PHP_VERSION; ?></td>
        </tr>
        <tr>
            <td><strong>Server Software</strong></td>
            <td><?php echo $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'; ?></td>
        </tr>
        <tr>
            <td><strong>Document Root</strong></td>
            <td><?php echo $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown'; ?></td>
        </tr>
        <tr>
            <td><strong>Application Root</strong></td>
            <td><?php echo APP_ROOT; ?></td>
        </tr>
        <tr>
            <td><strong>Environment</strong></td>
            <td><?php echo APP_ENV; ?></td>
        </tr>
        <tr>
            <td><strong>Error Reporting</strong></td>
            <td><?php echo error_reporting() ? 'Enabled' : 'Disabled'; ?></td>
        </tr>
    </table>
</div>
