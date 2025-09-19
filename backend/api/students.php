<?php
/**
 * Students API Endpoint
 * Handles CRUD operations for students
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
        if ($id) {
            getStudent($id);
        } else {
            getStudents();
        }
        break;
        
    case 'POST':
        createStudent($input);
        break;
        
    case 'PUT':
        if ($id) {
            updateStudent($id, $input);
        } else {
            sendErrorResponse('Student ID required for update', 400);
        }
        break;
        
    case 'DELETE':
        if ($id) {
            deleteStudent($id);
        } else {
            sendErrorResponse('Student ID required for deletion', 400);
        }
        break;
        
    default:
        sendErrorResponse('Method not allowed', 405);
}

/**
 * Get all students with optional filtering and pagination
 */
function getStudents() {
    try {
        // Get query parameters
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(MAX_PAGE_SIZE, max(1, intval($_GET['limit']))) : DEFAULT_PAGE_SIZE;
        $search = isset($_GET['search']) ? sanitizeInput($_GET['search']) : '';
        $course = isset($_GET['course']) ? sanitizeInput($_GET['course']) : '';
        $year = isset($_GET['year']) ? sanitizeInput($_GET['year']) : '';
        $gender = isset($_GET['gender']) ? sanitizeInput($_GET['gender']) : '';
        $semester = isset($_GET['semester']) ? sanitizeInput($_GET['semester']) : '';
        $status = isset($_GET['status']) ? sanitizeInput($_GET['status']) : 'Active';
        
        // Build WHERE clause
        $where_conditions = ['status = ?'];
        $params = [$status];
        
        if (!empty($search)) {
            $where_conditions[] = "(first_name LIKE ? OR last_name LIKE ? OR email LIKE ? OR student_id LIKE ?)";
            $search_param = "%$search%";
            $params = array_merge($params, [$search_param, $search_param, $search_param, $search_param]);
        }
        
        if (!empty($course)) {
            $where_conditions[] = "course = ?";
            $params[] = $course;
        }
        
        if (!empty($year)) {
            $where_conditions[] = "academic_year = ?";
            $params[] = $year;
        }
        
        if (!empty($gender)) {
            $where_conditions[] = "gender = ?";
            $params[] = $gender;
        }
        
        if (!empty($semester)) {
            $where_conditions[] = "semester = ?";
            $params[] = $semester;
        }
        
        $where_clause = implode(' AND ', $where_conditions);
        
        // Get total count
        $count_sql = "SELECT COUNT(*) as total FROM students WHERE $where_clause";
        $total_result = fetchOne($count_sql, $params);
        $total = $total_result['total'];
        
        // Calculate pagination
        $offset = ($page - 1) * $limit;
        $total_pages = ceil($total / $limit);
        
        // Get students
        $sql = "SELECT 
                    id, student_id, first_name, last_name, email, phone,
                    date_of_birth, gender, course, academic_year, semester,
                    address, city, state, zip_code, registration_date, status
                FROM students 
                WHERE $where_clause 
                ORDER BY registration_date DESC 
                LIMIT ? OFFSET ?";
        
        $params[] = $limit;
        $params[] = $offset;
        
        $students = fetchAll($sql, $params);
        
        // Format dates and calculate ages
        foreach ($students as &$student) {
            $student['age'] = calculateAge($student['date_of_birth']);
            $student['registration_date'] = date('Y-m-d H:i:s', strtotime($student['registration_date']));
        }
        
        sendSuccessResponse([
            'students' => $students,
            'pagination' => [
                'current_page' => $page,
                'total_pages' => $total_pages,
                'total_records' => $total,
                'per_page' => $limit,
                'has_next' => $page < $total_pages,
                'has_prev' => $page > 1
            ]
        ]);
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to fetch students', 500, $e->getMessage());
    }
}

/**
 * Get single student by ID
 */
function getStudent($id) {
    try {
        $sql = "SELECT 
                    id, student_id, first_name, last_name, email, phone,
                    date_of_birth, gender, course, academic_year, semester,
                    address, city, state, zip_code, registration_date, 
                    last_modified, status
                FROM students 
                WHERE id = ? AND status != 'Deleted'";
        
        $student = fetchOne($sql, [$id]);
        
        if (!$student) {
            sendErrorResponse('Student not found', 404);
        }
        
        // Calculate age
        $student['age'] = calculateAge($student['date_of_birth']);
        
        sendSuccessResponse($student);
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to fetch student', 500, $e->getMessage());
    }
}

/**
 * Create new student
 */
function createStudent($data) {
    try {
        // Validate required fields
        $required_fields = ['first_name', 'last_name', 'email', 'date_of_birth', 'gender', 'course', 'academic_year', 'semester'];
        
        foreach ($required_fields as $field) {
            if (empty($data[$field])) {
                sendErrorResponse("Field '$field' is required", 400);
            }
        }
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Validate email format
        if (!isValidEmail($data['email'])) {
            sendErrorResponse('Invalid email format', 400);
        }
        
        // Check if email already exists
        $existing = fetchOne("SELECT id FROM students WHERE email = ? AND status != 'Deleted'", [$data['email']]);
        if ($existing) {
            sendErrorResponse('Email already registered', 400);
        }
        
        // Validate phone if provided
        if (!empty($data['phone']) && !isValidPhone($data['phone'])) {
            sendErrorResponse('Invalid phone format. Use (237)690-000-000', 400);
        }
        
        // Validate age
        $age = calculateAge($data['date_of_birth']);
        if ($age < 16 || $age > 100) {
            sendErrorResponse('Age must be between 16 and 100 years', 400);
        }
        
        // Generate student ID if not provided
        if (empty($data['student_id'])) {
            $data['student_id'] = generateStudentId();
            if (!$data['student_id']) {
                sendErrorResponse('Failed to generate student ID', 500);
            }
        } else {
            // Check if student ID already exists
            $existing = fetchOne("SELECT id FROM students WHERE student_id = ? AND status != 'Deleted'", [$data['student_id']]);
            if ($existing) {
                sendErrorResponse('Student ID already exists', 400);
            }
        }
        
        // Insert student
        $sql = "INSERT INTO students (
                    student_id, first_name, last_name, email, phone,
                    date_of_birth, gender, course, academic_year, semester,
                    address, city, state, zip_code
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        
        $params = [
            $data['student_id'],
            $data['first_name'],
            $data['last_name'],
            $data['email'],
            $data['phone'] ?? null,
            $data['date_of_birth'],
            $data['gender'],
            $data['course'],
            $data['academic_year'],
            $data['semester'],
            $data['address'] ?? null,
            $data['city'] ?? null,
            $data['state'] ?? null,
            $data['zip_code'] ?? null
        ];
        
        $student_id = insertRecord($sql, $params);
        
        // Get the created student
        $student = fetchOne("SELECT * FROM students WHERE id = ?", [$student_id]);
        
        sendSuccessResponse($student, 'Student registered successfully');
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to create student', 500, $e->getMessage());
    }
}

/**
 * Update existing student
 */
function updateStudent($id, $data) {
    try {
        // Check if student exists
        $existing = fetchOne("SELECT * FROM students WHERE id = ? AND status != 'Deleted'", [$id]);
        if (!$existing) {
            sendErrorResponse('Student not found', 404);
        }
        
        // Sanitize input
        $data = sanitizeInput($data);
        
        // Validate email if provided
        if (isset($data['email'])) {
            if (!isValidEmail($data['email'])) {
                sendErrorResponse('Invalid email format', 400);
            }
            
            // Check if email already exists (excluding current student)
            $email_check = fetchOne("SELECT id FROM students WHERE email = ? AND id != ? AND status != 'Deleted'", [$data['email'], $id]);
            if ($email_check) {
                sendErrorResponse('Email already registered', 400);
            }
        }
        
        // Validate phone if provided
        if (isset($data['phone']) && !empty($data['phone']) && !isValidPhone($data['phone'])) {
            sendErrorResponse('Invalid phone format. Use (237)690-000-000', 400);
        }
        
        // Validate age if date_of_birth is provided
        if (isset($data['date_of_birth'])) {
            $age = calculateAge($data['date_of_birth']);
            if ($age < 16 || $age > 100) {
                sendErrorResponse('Age must be between 16 and 100 years', 400);
            }
        }
        
        // Build update query
        $update_fields = [];
        $params = [];
        
        $allowed_fields = [
            'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
            'gender', 'course', 'academic_year', 'semester',
            'address', 'city', 'state', 'zip_code', 'status'
        ];
        
        foreach ($allowed_fields as $field) {
            if (isset($data[$field])) {
                $update_fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }
        
        if (empty($update_fields)) {
            sendErrorResponse('No valid fields to update', 400);
        }
        
        $params[] = $id;
        
        $sql = "UPDATE students SET " . implode(', ', $update_fields) . " WHERE id = ?";
        $affected_rows = updateRecord($sql, $params);
        
        if ($affected_rows === 0) {
            sendErrorResponse('No changes made', 400);
        }
        
        // Get updated student
        $student = fetchOne("SELECT * FROM students WHERE id = ?", [$id]);
        
        sendSuccessResponse($student, 'Student updated successfully');
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to update student', 500, $e->getMessage());
    }
}

/**
 * Delete student (soft delete)
 */
function deleteStudent($id) {
    try {
        // Check if student exists
        $existing = fetchOne("SELECT * FROM students WHERE id = ? AND status != 'Deleted'", [$id]);
        if (!$existing) {
            sendErrorResponse('Student not found', 404);
        }
        
        // Soft delete by updating status
        $sql = "UPDATE students SET status = 'Deleted' WHERE id = ?";
        $affected_rows = updateRecord($sql, [$id]);
        
        if ($affected_rows === 0) {
            sendErrorResponse('Failed to delete student', 500);
        }
        
        sendSuccessResponse(null, 'Student deleted successfully');
        
    } catch (Exception $e) {
        sendErrorResponse('Failed to delete student', 500, $e->getMessage());
    }
}

/**
 * Calculate age from date of birth
 */
function calculateAge($date_of_birth) {
    $dob = new DateTime($date_of_birth);
    $now = new DateTime();
    return $now->diff($dob)->y;
}

/**
 * Bulk delete students
 */
if ($method === 'DELETE' && isset($_GET['bulk'])) {
    $ids = $input['ids'] ?? [];

    if (empty($ids) || !is_array($ids)) {
        sendErrorResponse('Student IDs required for bulk delete', 400);
    }

    try {
        $placeholders = str_repeat('?,', count($ids) - 1) . '?';
        $sql = "UPDATE students SET status = 'Deleted' WHERE id IN ($placeholders) AND status != 'Deleted'";
        $affected_rows = updateRecord($sql, $ids);

        sendSuccessResponse(['deleted_count' => $affected_rows], "$affected_rows students deleted successfully");

    } catch (Exception $e) {
        sendErrorResponse('Failed to delete students', 500, $e->getMessage());
    }
    exit;
}

/**
 * Get statistics
 */
if ($method === 'GET' && isset($_GET['stats'])) {
    try {
        $stats = [
            'total_students' => fetchOne("SELECT COUNT(*) as count FROM students WHERE status = 'Active'")['count'],
            'total_courses' => fetchOne("SELECT COUNT(DISTINCT course) as count FROM students WHERE status = 'Active'")['count'],
            'by_course' => fetchAll("SELECT course, COUNT(*) as count FROM students WHERE status = 'Active' GROUP BY course"),
            'by_year' => fetchAll("SELECT academic_year, COUNT(*) as count FROM students WHERE status = 'Active' GROUP BY academic_year"),
            'by_gender' => fetchAll("SELECT gender, COUNT(*) as count FROM students WHERE status = 'Active' GROUP BY gender"),
            'recent_registrations' => fetchAll("SELECT DATE(registration_date) as date, COUNT(*) as count FROM students WHERE status = 'Active' AND registration_date >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(registration_date) ORDER BY date DESC")
        ];

        sendSuccessResponse($stats);

    } catch (Exception $e) {
        sendErrorResponse('Failed to fetch statistics', 500, $e->getMessage());
    }
    exit;
}
?>
