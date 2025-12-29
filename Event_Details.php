<?php
require_once __DIR__ . '/../headers.php';
require_once 'db_connection.php';
require_once 'utils/ApiResponse.php';
require_once 'utils/ApiError.php';
require_once 'utils/asyncHandler.php';

$getEvents = asyncHandler(function() use ($conn) {
    $query = "SELECT id, event_name as name, event_date as date FROM events ORDER BY event_date DESC";
    $stmt = $conn->prepare($query);
    $stmt->execute();
    
    $events = $stmt->fetchAll(PDO::FETCH_ASSOC);

    if (!$events) {
        // Example: Even empty data is a success, just empty
        return (new ApiResponse(200, [], "No events found"))->send();
    }

    return (new ApiResponse(200, $events, "Events fetched successfully"))->send();
});

// Execute
$getEvents();
?>