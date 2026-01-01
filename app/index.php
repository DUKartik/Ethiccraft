<?php
// Central Router (index.php)

// 1. CORS & Headers
$allowed_origins = ['http://localhost:3000', 'http://localhost:3001'];
if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
}
header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Credentials: true");

// Session Settings (Moved from headers.php)
ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_secure', '1');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 2. Load Utils FIRST (so config can use them if needed)
require_once 'utils/ApiResponse.php';
require_once 'utils/ApiError.php';
require_once 'utils/asyncHandler.php';

// 3. Load Config
require_once 'config.php';

// 4. Initialize Database Connection (Global for controllers)
try {
    $conn = getDBConnection();
} catch (Exception $e) {
    // Catch DB connection errors immediately
    $code = $e instanceof ApiError ? $e->statusCode : 500;
    (new ApiResponse($code, null, $e->getMessage()))->send();
    exit;
}

// 5. Routing Logic
$route = $_GET['route'] ?? '';

// Simple Router Switch
switch ($route) {
    case 'login':
        require_once 'controllers/Login.php';
        break;
    case 'events':
        require_once 'controllers/Event_Details.php';
        break;
    case 'attendees':
        require_once 'controllers/Get_Attendees.php';
        break;
    case 'verify':
        require_once 'controllers/verify_qr.php';
        break;
    default:
        // Use ApiResponse for 404
        (new ApiResponse(404, null, "Invalid Route"))->send();
        break;
}
?>
