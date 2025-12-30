<?php
require_once __DIR__ . '/ApiError.php';

function asyncHandler($fn) {
    return function() use ($fn) {
        try {
            // Execute the controller logic
            $fn();
        } catch (Exception $e) {
            // Check if it's our custom ApiError or a generic PHP error
            $statusCode = ($e instanceof ApiError) ? $e->statusCode : 500;
            $message = $e->getMessage();
            
            http_response_code($statusCode);
            echo json_encode([
                "success" => false,
                "message" => $message,
                "errors" => ($e instanceof ApiError) ? $e->errors : []
            ]);
            exit;
        }
    };
}
?>