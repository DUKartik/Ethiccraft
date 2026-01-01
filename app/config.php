<?php
// Database Configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'ethiccraft'); 

function getDBConnection() {
    // Ensure ApiError class is available
    if (!class_exists('ApiError')) {
        die(json_encode(["success" => false, "message" => "Critical Error: ApiError class not loaded."]));
    }

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {

        throw new ApiError(500, "Database Connection Failed: " . $conn->connect_error);
    }
    
    return $conn;
}
?>
