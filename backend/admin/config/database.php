<?php
/**
 * Database Configuration for Student Registration System
 * WAMP/Windows Local Development Setup
 */

class Database {
    // Database configuration for WAMP
    private $host = 'localhost';
    private $db_name = 'student_registration_system';
    private $username = 'root';
    private $password = ''; // Default WAMP password is empty
    private $port = 3306;
    private $charset = 'utf8mb4';
    
    public $conn;
    
    /**
     * Get database connection
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . 
                   ";port=" . $this->port . 
                   ";dbname=" . $this->db_name . 
                   ";charset=" . $this->charset;
            
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4"
            ];
            
            $this->conn = new PDO($dsn, $this->username, $this->password, $options);
            
        } catch(PDOException $exception) {
            error_log("Connection error: " . $exception->getMessage());
            throw new Exception("Database connection failed: " . $exception->getMessage());
        }
        
        return $this->conn;
    }
    
    /**
     * Test database connection
     */
    public function testConnection() {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT 1");
            return true;
        } catch(Exception $e) {
            return false;
        }
    }
    
    /**
     * Get database info
     */
    public function getDatabaseInfo() {
        try {
            $conn = $this->getConnection();
            $stmt = $conn->query("SELECT VERSION() as version");
            $result = $stmt->fetch();
            
            return [
                'host' => $this->host,
                'database' => $this->db_name,
                'version' => $result['version'],
                'charset' => $this->charset
            ];
        } catch(Exception $e) {
            return null;
        }
    }
    
    /**
     * Check if database exists
     */
    public function databaseExists() {
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";charset=" . $this->charset;
            $conn = new PDO($dsn, $this->username, $this->password);
            
            $stmt = $conn->prepare("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?");
            $stmt->execute([$this->db_name]);
            
            return $stmt->rowCount() > 0;
        } catch(Exception $e) {
            return false;
        }
    }
    
    /**
     * Create database if it doesn't exist
     */
    public function createDatabase() {
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";charset=" . $this->charset;
            $conn = new PDO($dsn, $this->username, $this->password);
            
            $sql = "CREATE DATABASE IF NOT EXISTS `" . $this->db_name . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
            $conn->exec($sql);
            
            return true;
        } catch(Exception $e) {
            error_log("Database creation error: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Execute SQL file (for schema installation)
     */
    public function executeSqlFile($filepath) {
        try {
            if (!file_exists($filepath)) {
                throw new Exception("SQL file not found: " . $filepath);
            }
            
            $sql = file_get_contents($filepath);
            $conn = $this->getConnection();
            
            // Split SQL into individual statements
            $statements = array_filter(
                array_map('trim', explode(';', $sql)),
                function($stmt) {
                    return !empty($stmt) && !preg_match('/^--/', $stmt);
                }
            );
            
            foreach ($statements as $statement) {
                if (!empty($statement)) {
                    $conn->exec($statement);
                }
            }
            
            return true;
        } catch(Exception $e) {
            error_log("SQL execution error: " . $e->getMessage());
            return false;
        }
    }
}

/**
 * Global database instance
 */
function getDatabase() {
    static $database = null;
    if ($database === null) {
        $database = new Database();
    }
    return $database;
}

/**
 * Get database connection
 */
function getConnection() {
    return getDatabase()->getConnection();
}

/**
 * Execute prepared statement with error handling
 */
function executeQuery($sql, $params = []) {
    try {
        $conn = getConnection();
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    } catch(PDOException $e) {
        error_log("Query execution error: " . $e->getMessage());
        throw new Exception("Database query failed");
    }
}

/**
 * Get single record
 */
function fetchOne($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetch();
}

/**
 * Get multiple records
 */
function fetchAll($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->fetchAll();
}

/**
 * Insert record and return last insert ID
 */
function insertRecord($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return getConnection()->lastInsertId();
}

/**
 * Update/Delete record and return affected rows
 */
function updateRecord($sql, $params = []) {
    $stmt = executeQuery($sql, $params);
    return $stmt->rowCount();
}

/**
 * Begin transaction
 */
function beginTransaction() {
    return getConnection()->beginTransaction();
}

/**
 * Commit transaction
 */
function commitTransaction() {
    return getConnection()->commit();
}

/**
 * Rollback transaction
 */
function rollbackTransaction() {
    return getConnection()->rollBack();
}

/**
 * Check if we're in a transaction
 */
function inTransaction() {
    return getConnection()->inTransaction();
}
?>
