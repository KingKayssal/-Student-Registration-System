<?php
/**
 * Admin Panel for Student Registration System
 * Simple PHP interface for managing the system
 */

// Define APP_ROOT if not already defined
if (!defined('APP_ROOT')) {
    define('APP_ROOT', dirname(dirname(__FILE__)));
}

// Include configuration
require_once APP_ROOT . '/config/config.php';

// Check if database exists and create if needed
$db = getDatabase();
if (!$db->databaseExists()) {
    $db->createDatabase();
}

// Get page parameter
$page = $_GET['page'] ?? 'dashboard';

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Panel - <?php echo APP_NAME; ?></title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #ff7b00 0%, #1e3c72 100%);
            min-height: 100vh;
            color: #333;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: white;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav {
            display: flex;
            gap: 20px;
            margin-top: 20px;
        }
        
        .nav a {
            padding: 10px 20px;
            background: #ff7b00;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            transition: background 0.3s;
        }
        
        .nav a:hover, .nav a.active {
            background: #1e3c72;
        }
        
        .content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #ff7b00;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: linear-gradient(135deg, #ff7b00, #ff5722);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
        }
        
        .stat-card h3 {
            font-size: 2rem;
            margin-bottom: 10px;
        }
        
        .btn {
            display: inline-block;
            padding: 10px 20px;
            background: #ff7b00;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            border: none;
            cursor: pointer;
            margin: 5px;
        }
        
        .btn:hover {
            background: #ff5722;
        }
        
        .btn-secondary {
            background: #1e3c72;
        }
        
        .btn-secondary:hover {
            background: #2a5298;
        }
        
        .form-group {
            margin-bottom: 15px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 5px;
            font-weight: 600;
        }
        
        .form-group input, .form-group textarea {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        
        .alert {
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        
        .alert-success {
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-error {
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        .table th, .table td {
            padding: 12px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        .table th {
            background: #f8f9fa;
            font-weight: 600;
        }
        
        .table tr:hover {
            background: #f8f9fa;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎓 <?php echo APP_NAME; ?> - Admin Panel</h1>
            <p>Manage your student registration system</p>
            
            <div class="nav">
                <a href="?page=dashboard" class="<?php echo $page === 'dashboard' ? 'active' : ''; ?>">Dashboard</a>
                <a href="?page=setup" class="<?php echo $page === 'setup' ? 'active' : ''; ?>">Setup Database</a>
                <a href="?page=test" class="<?php echo $page === 'test' ? 'active' : ''; ?>">Test System</a>
                <a href="?page=settings" class="<?php echo $page === 'settings' ? 'active' : ''; ?>">Settings</a>
                <a href="../api/test" target="_blank">API Test</a>
                <a href="../../index.html" target="_blank">Frontend</a>
            </div>
        </div>
        
        <div class="content">
            <?php
            switch ($page) {
                case 'setup':
                    include 'setup.php';
                    break;
                case 'test':
                    include 'test.php';
                    break;
                case 'settings':
                    include 'settings.php';
                    break;
                default:
                    include 'dashboard.php';
            }
            ?>
        </div>
    </div>
</body>
</html>
