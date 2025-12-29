<?php
require_once __DIR__ . '/../headers.php';
require_once 'db_connection.php';
require_once 'utils/ApiResponse.php';
require_once 'utils/ApiError.php';
require_once 'utils/asyncHandler.php';

$verifyQr = asyncHandler(function() use ($conn) {
    // 1. Get Data
    $input = json_decode(file_get_contents("php://input"));
    
    if (!isset($input->event_id) || !isset($input->qr_code)) {
        throw new ApiError(400, "Event ID and QR Code are required");
    }

    $event_id = $input->event_id;
    $qr_code = $input->qr_code;

    // 2. Find Ticket
    $query = "SELECT r.id, r.student_name, r.course, r.year, r.gender, r.attendance_status 
              FROM registrations r 
              WHERE r.event_id = :event_id AND r.qr_code_value = :qr_code";
              
    $stmt = $conn->prepare($query);
    $stmt->execute([':event_id' => $event_id, ':qr_code' => $qr_code]);

    if ($stmt->rowCount() === 0) {
        throw new ApiError(404, "Invalid Ticket or Wrong Event");
    }

    $student = $stmt->fetch(PDO::FETCH_ASSOC);

    // 3. Check Logic
    if ($student['attendance_status'] === 'present') {
        throw new ApiError(409, "Student already scanned: " . $student['student_name']);
    }

    // 4. Update Database
    $updateQuery = "UPDATE registrations 
                    SET attendance_status = 'present', check_in_time = NOW() 
                    WHERE id = :id";
    $updateStmt = $conn->prepare($updateQuery);
    
    if (!$updateStmt->execute([':id' => $student['id']])) {
        throw new ApiError(500, "Failed to mark attendance in database");
    }

    // 5. Send Success Response
    $responseData = [
        "name" => $student['student_name'],
        "id" => $qr_code,
        "course" => $student['course']
    ];

    (new ApiResponse(200, $responseData, "Attendance marked successfully"))->send();
});

// Execute
$verifyQr();
?>