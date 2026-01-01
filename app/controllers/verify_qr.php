<?php
// (Handled by index.php: headers, utils, config, $conn)

header('Content-Type: application/json');
$markAttendance = asyncHandler(function() use ($conn) {
    // 1. Get Input Data from the React App
    $data = json_decode(file_get_contents("php://input"), true);

    $event_id = isset($data['event_id']) ? intval($data['event_id']) : 0;
    $qr_input = isset($data['qr_code']) ? trim($data['qr_code']) : '';

    // Basic Validation
    if ($event_id <= 0 || empty($qr_input)) {
        throw new ApiError(400, "Invalid Event or QR Code.");
    }

    // 2. PARSE THE QR CODE (Crucial Step)
    // The QR code is a JSON string: {"ticket_id":"...", "email":null, ...}
    // We try to decode it. If it's not JSON, we assume it's a plain ID.
    $qr_json = json_decode($qr_input, true);
    if (json_last_error() === JSON_ERROR_NONE && isset($qr_json['ticket_id'])) {
        $ticket_id_to_search = $qr_json['ticket_id'];
    } else {
        $ticket_id_to_search = $qr_input; // Fallback for plain text QRs
    }

    // 3. Check if the Ticket Exists
    // Fixed SQL: Removed trailing comma after 'year_of_study'
    $sql = "SELECT 
                e.id AS booking_id,
                e.ticket_id,
                e.event_id,
                e.attendance,
                e.email,
                s.full_name,
                s.department,
                s.year_of_study
            FROM event_bookings e
            LEFT JOIN user_profiles s ON e.email = s.email
            WHERE e.ticket_id = ? AND e.event_id = ?";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception("SQL Preparation Error: " . $conn->error);
    }
    $stmt->bind_param("si", $ticket_id_to_search, $event_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $ticket = $result->fetch_assoc();
    $stmt->close();
    // 4. Logic Checks

    // Scenario A: Ticket not found
    if (!$ticket) {
        // Return 404 but with a standard message
        throw new ApiError(404, "Invalid Ticket. User not registered for this event.");
    }

    // Scenario B: Already Checked In
    // Assuming 'attendance' column is 1 for present, 0 for absent
    if ($ticket['attendance'] == 1) { 
        $studentData = [
            "name"   => $ticket['full_name'] ?? "Unknown",
            "id"     => $ticket['ticket_id'],
            "course" => $ticket['department'] ?? "N/A",
            "year"   => $ticket['year_of_study'] ?? "N/A",
        ];

        return (new ApiResponse(409, [
            "student" => $studentData
        ], "Ticket already used. Student is already checked in."))->send();
    }

    // Scenario C: Valid Ticket -> Mark Attendance
    // We use the INTERNAL DB ID ($ticket['booking_id']) to be safe
    $updateSql = "UPDATE event_bookings 
                SET attendance = 1 
                WHERE id = ?";

    $updateStmt = $conn->prepare($updateSql);
    $updateStmt->bind_param("i", $ticket['booking_id']); // "i" for integer ID

    if ($updateStmt->execute()) {
        $studentData = [
            "name"   => $ticket['full_name'] ?? "Unknown",
            "id"     => $ticket['ticket_id'],
            "course" => $ticket['department'] ?? "N/A",
            "year"   => $ticket['year_of_study'] ?? "N/A",
        ];
        $updateStmt->close();
        return (new ApiResponse(200, [
            "status" => "success",
            "student" => $studentData
        ], "Attendance Marked Successfully!"))->send();
    } else {
        throw new Exception("Failed to update attendance database.");
    }

    $stmt->close();
    $updateStmt->close();
});

$markAttendance();
?>