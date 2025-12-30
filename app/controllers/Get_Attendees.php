<?php

require_once __DIR__ .'/../headers.php'; 
require_once __DIR__ .'/../utils/ApiResponse.php';
require_once __DIR__ .'/../utils/ApiError.php';
require_once __DIR__ .'/../utils/asyncHandler.php';
$getAttendees = asyncHandler(function() use ($conn) {
    $event_id = isset($_GET['event_id']) ? intval($_GET['event_id']) : 0;

    if ($event_id <= 0) {
        echo json_encode([]); 
        exit;
    }

    $sql = "SELECT 
                e.id AS booking_id,
                e.event_id,
                e.user_name,
                e.email,
                DATE_FORMAT(e.booking_time, '%h:%i %p') AS booking_time,
                s.full_name,
                s.gender,
                s.college,
                s.department,
                s.year_of_study
            FROM event_bookings e
            LEFT JOIN user_profiles s ON e.email = s.email
            WHERE e.event_id = ?
            ORDER BY s.full_name DESC;
            ";

    $stmt = $conn->prepare($sql);

    if (!$stmt) {
        throw new Exception("Query preparation failed: " . $conn->error);
    }

    $stmt->bind_param("i", $event_id);
    $stmt->execute();
    $result = $stmt->get_result();

    $attendees = array();

    while ($row = $result->fetch_assoc()) {
        $imagePath = $row['image'] ? "https://ethiccraft.org/uploads/" . $row['image'] : null;

        $attendees[] = array(
            "name"   => $row['full_name'],
            "id"     => $row['id'],      // e.g. "ST-2025"
            "gender" => $row['gender'],    // e.g. "Male"
            "course" => $row['department'],  // e.g. "B.Tech CSE"
            "year"   => $row['year_of_study'],    // e.g. "3rd Year"
            "time"   => $row['booking_time'],    // e.g. "10:30 AM"
            "image"  => $imagePath
        );
    }
    $stmt->close();
    return (new ApiResponse(200, $attendees, "Attendees fetched successfully"))->send();
});
$getAttendees();
?>