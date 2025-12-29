<?php
require_once __DIR__ . '/../headers.php';
require_once 'db_connection.php';
require_once 'utils/ApiResponse.php';
require_once 'utils/ApiError.php';
require_once 'utils/asyncHandler.php';

$getAttendees = asyncHandler(function() use ($conn) {
    if (!isset($_GET['event_id'])) {
        throw new ApiError(400, "Event ID is required");
    }

    $event_id = $_GET['event_id'];

    $query = "SELECT 
                student_name as name, 
                qr_code_value as id, 
                course, year, gender, 
                DATE_FORMAT(check_in_time, '%H:%i:%s') as time 
              FROM registrations 
              WHERE event_id = :event_id AND attendance_status = 'present'
              ORDER BY check_in_time DESC";

    $stmt = $conn->prepare($query);
    $stmt->execute([':event_id' => $event_id]);
    
    $attendees = $stmt->fetchAll(PDO::FETCH_ASSOC);

    (new ApiResponse(200, $attendees, "Attendees list fetched"))->send();
});

// Execute
$getAttendees();
?>