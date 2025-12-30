<?php
require_once __DIR__ .'/../headers.php'; 
require_once __DIR__ .'/../utils/ApiResponse.php';
require_once __DIR__ .'/../utils/ApiError.php';
require_once __DIR__ .'/../utils/asyncHandler.php';

$getEvents = asyncHandler(function() use ($conn) {

    $sql = "SELECT id, name, date 
            FROM upcoming_events 
            ORDER BY date DESC"; 

    $result = $conn->query($sql);

    if (!$result) {
        throw new Exception("Query Failed"); 
    }

    $events = array();

    if ($result && $result->num_rows > 0) {
        while($row = $result->fetch_assoc()) {
            // React expects date in "YYYY-MM-DD" format.
            
            $events[] = array(
                "id" => $row['id'],
                "name" => $row['name'],
                "date" => $row['date']
            );
        }
    } 
    return (new ApiResponse(200, $events, "Events fetched successfully"))->send();
});
// Return JSON (returns empty array [] if no events found, which handles the "No Events" state in React)
$getEvents();
?>