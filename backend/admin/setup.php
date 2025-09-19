<?php
/**
 * Database Setup Page
 */

$message = '';
$message_type = '';

// Handle form submission
if ($_POST['action'] ?? '' === 'setup_database') {
    try {
        $db = getDatabase();
        
        // Create database if it doesn't exist
        if (!$db->databaseExists()) {
            $db->createDatabase();
            $message .= "✅ Database created successfully.<br>";
        } else {
            $message .= "ℹ️ Database already exists.<br>";
        }
        
        // Execute schema file
        $schema_file = APP_ROOT . '/database/schema.sql';
        if (file_exists($schema_file)) {
            $result = $db->executeSqlFile($schema_file);
            if ($result) {
                $message .= "✅ Database schema installed successfully.<br>";
            } else {
                $message .= "❌ Failed to install database schema.<br>";
            }
        } else {
            $message .= "❌ Schema file not found: $schema_file<br>";
        }
        
        $message_type = 'success';
        
    } catch (Exception $e) {
        $message = "❌ Setup failed: " . $e->getMessage();
        $message_type = 'error';
    }
}

// Check current database status
$db_exists = false;
$tables_exist = false;
$sample_data = false;

try {
    $db = getDatabase();
    $db_exists = $db->databaseExists();
    
    if ($db_exists) {
        $tables = fetchAll("SHOW TABLES");
        $tables_exist = count($tables) > 0;
        
        if ($tables_exist) {
            $student_count = fetchOne("SELECT COUNT(*) as count FROM students")['count'] ?? 0;
            $sample_data = $student_count > 0;
        }
    }
} catch (Exception $e) {
    // Database connection issues
}
?>

<h2>🔧 Database Setup</h2>

<?php if ($message): ?>
<div class="alert alert-<?php echo $message_type; ?>">
    <?php echo $message; ?>
</div>
<?php endif; ?>

<div class="card">
    <h3>📊 Current Status</h3>
    <table class="table">
        <tr>
            <td><strong>Database Connection</strong></td>
            <td><?php echo $db_exists ? '✅ Connected' : '❌ Not Connected'; ?></td>
        </tr>
        <tr>
            <td><strong>Database Exists</strong></td>
            <td><?php echo $db_exists ? '✅ Yes' : '❌ No'; ?></td>
        </tr>
        <tr>
            <td><strong>Tables Created</strong></td>
            <td><?php echo $tables_exist ? '✅ Yes' : '❌ No'; ?></td>
        </tr>
        <tr>
            <td><strong>Sample Data</strong></td>
            <td><?php echo $sample_data ? '✅ Yes' : '❌ No'; ?></td>
        </tr>
    </table>
</div>

<div class="card">
    <h3>🚀 Setup Instructions</h3>
    
    <h4>Prerequisites:</h4>
    <ol>
        <li><strong>WAMP Server</strong> must be running</li>
        <li><strong>Apache</strong> and <strong>MySQL</strong> services started</li>
        <li><strong>phpMyAdmin</strong> accessible at <a href="http://localhost/phpmyadmin" target="_blank">http://localhost/phpmyadmin</a></li>
    </ol>
    
    <h4>Automatic Setup:</h4>
    <p>Click the button below to automatically create the database and install the schema:</p>
    
    <form method="post">
        <input type="hidden" name="action" value="setup_database">
        <button type="submit" class="btn" <?php echo ($db_exists && $tables_exist) ? 'disabled' : ''; ?>>
            🔧 Setup Database
        </button>
    </form>
    
    <h4>Manual Setup (Alternative):</h4>
    <ol>
        <li>Open <a href="http://localhost/phpmyadmin" target="_blank">phpMyAdmin</a></li>
        <li>Create a new database named <code>student_registration_system</code></li>
        <li>Import the SQL file: <code>backend/database/schema.sql</code></li>
        <li>Verify tables are created successfully</li>
    </ol>
</div>

<div class="card">
    <h3>📋 Database Configuration</h3>
    <table class="table">
        <tr>
            <td><strong>Host</strong></td>
            <td>localhost</td>
        </tr>
        <tr>
            <td><strong>Database Name</strong></td>
            <td>student_registration_system</td>
        </tr>
        <tr>
            <td><strong>Username</strong></td>
            <td>root</td>
        </tr>
        <tr>
            <td><strong>Password</strong></td>
            <td>(empty - default WAMP)</td>
        </tr>
        <tr>
            <td><strong>Port</strong></td>
            <td>3306</td>
        </tr>
    </table>
    
    <p><strong>Note:</strong> These are the default WAMP settings. If you've changed your MySQL configuration, update the settings in <code>backend/config/database.php</code></p>
</div>

<?php if ($db_exists && $tables_exist): ?>
<div class="card">
    <h3>✅ Setup Complete!</h3>
    <p>Your database is ready to use. You can now:</p>
    <ul>
        <li><a href="../../register.html" target="_blank">Register students</a> using the frontend</li>
        <li><a href="../../view-students.html" target="_blank">View and manage students</a></li>
        <li><a href="../api/" target="_blank">Test the API endpoints</a></li>
        <li><a href="?page=test">Run system tests</a> to verify everything is working</li>
    </ul>
</div>
<?php endif; ?>

<div class="card">
    <h3>🔍 Troubleshooting</h3>
    
    <h4>Common Issues:</h4>
    <ul>
        <li><strong>Connection refused:</strong> Make sure WAMP is running and MySQL service is started</li>
        <li><strong>Access denied:</strong> Check MySQL username/password in database.php</li>
        <li><strong>Database not found:</strong> Run the automatic setup or create database manually</li>
        <li><strong>Permission denied:</strong> Ensure WAMP has proper file permissions</li>
    </ul>
    
    <h4>Useful Links:</h4>
    <ul>
        <li><a href="http://localhost/phpmyadmin" target="_blank">phpMyAdmin</a></li>
        <li><a href="http://localhost" target="_blank">WAMP Homepage</a></li>
        <li><a href="../api/test" target="_blank">API Test Endpoint</a></li>
    </ul>
</div>
