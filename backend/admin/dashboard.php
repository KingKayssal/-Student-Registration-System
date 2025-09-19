<?php
/**
 * Admin Dashboard
 */

// Get statistics
try {
    $stats = [
        'total_students' => fetchOne("SELECT COUNT(*) as count FROM students WHERE status = 'Active'")['count'] ?? 0,
        'total_courses' => fetchOne("SELECT COUNT(DISTINCT course) as count FROM students WHERE status = 'Active'")['count'] ?? 0,
        'total_admins' => fetchOne("SELECT COUNT(*) as count FROM admin_users WHERE is_active = 1")['count'] ?? 0,
        'recent_registrations' => fetchOne("SELECT COUNT(*) as count FROM students WHERE registration_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)")['count'] ?? 0
    ];
    
    $recent_students = fetchAll("
        SELECT student_id, first_name, last_name, email, course, registration_date 
        FROM students 
        WHERE status = 'Active' 
        ORDER BY registration_date DESC 
        LIMIT 10
    ");
    
    $course_stats = fetchAll("
        SELECT course, COUNT(*) as count 
        FROM students 
        WHERE status = 'Active' 
        GROUP BY course 
        ORDER BY count DESC
    ");
    
} catch (Exception $e) {
    $stats = ['total_students' => 0, 'total_courses' => 0, 'total_admins' => 0, 'recent_registrations' => 0];
    $recent_students = [];
    $course_stats = [];
    echo '<div class="alert alert-error">Database connection error: ' . htmlspecialchars($e->getMessage()) . '</div>';
}
?>

<h2>📊 Dashboard</h2>

<div class="stats">
    <div class="stat-card">
        <h3><?php echo $stats['total_students']; ?></h3>
        <p>Total Students</p>
    </div>
    <div class="stat-card">
        <h3><?php echo $stats['total_courses']; ?></h3>
        <p>Active Courses</p>
    </div>
    <div class="stat-card">
        <h3><?php echo $stats['total_admins']; ?></h3>
        <p>Admin Users</p>
    </div>
    <div class="stat-card">
        <h3><?php echo $stats['recent_registrations']; ?></h3>
        <p>This Week</p>
    </div>
</div>

<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 30px;">
    <div class="card">
        <h3>📝 Recent Registrations</h3>
        <?php if (empty($recent_students)): ?>
            <p>No students registered yet.</p>
            <a href="../../register.html" class="btn" target="_blank">Register First Student</a>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Course</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($recent_students as $student): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($student['student_id']); ?></td>
                        <td><?php echo htmlspecialchars($student['first_name'] . ' ' . $student['last_name']); ?></td>
                        <td><?php echo htmlspecialchars($student['course']); ?></td>
                        <td><?php echo date('M j, Y', strtotime($student['registration_date'])); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
            <a href="../../view-students.html" class="btn" target="_blank">View All Students</a>
        <?php endif; ?>
    </div>
    
    <div class="card">
        <h3>📚 Course Distribution</h3>
        <?php if (empty($course_stats)): ?>
            <p>No course data available.</p>
        <?php else: ?>
            <table class="table">
                <thead>
                    <tr>
                        <th>Course</th>
                        <th>Students</th>
                        <th>Percentage</th>
                    </tr>
                </thead>
                <tbody>
                    <?php 
                    $total = array_sum(array_column($course_stats, 'count'));
                    foreach ($course_stats as $course): 
                        $percentage = $total > 0 ? round(($course['count'] / $total) * 100, 1) : 0;
                    ?>
                    <tr>
                        <td><?php echo htmlspecialchars($course['course']); ?></td>
                        <td><?php echo $course['count']; ?></td>
                        <td><?php echo $percentage; ?>%</td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>
</div>

<div class="card">
    <h3>🚀 Quick Actions</h3>
    <a href="../../register.html" class="btn" target="_blank">Register New Student</a>
    <a href="../../view-students.html" class="btn" target="_blank">Manage Students</a>
    <a href="../api/" class="btn btn-secondary" target="_blank">API Documentation</a>
    <a href="?page=test" class="btn btn-secondary">Run System Tests</a>
</div>

<div class="card">
    <h3>📋 System Information</h3>
    <p><strong>Application:</strong> <?php echo APP_NAME . ' v' . APP_VERSION; ?></p>
    <p><strong>Environment:</strong> <?php echo APP_ENV; ?></p>
    <p><strong>PHP Version:</strong> <?php echo PHP_VERSION; ?></p>
    <p><strong>Database:</strong> <?php 
        try {
            $db_info = getDatabase()->getDatabaseInfo();
            echo $db_info['database'] . ' (' . $db_info['version'] . ')';
        } catch (Exception $e) {
            echo 'Connection Error';
        }
    ?></p>
    <p><strong>Server Time:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
</div>
