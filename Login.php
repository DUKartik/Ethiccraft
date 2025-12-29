<?php
// 1. Setup & Imports
require_once __DIR__ . '/headers.php'; 
require_once 'utils/ApiResponse.php';
require_once 'utils/ApiError.php';
require_once 'utils/asyncHandler.php';

// 2. Session Configuration (Keep this global as it needs to run before logic)
$lifetime = 259200; // 3 days
ini_set('session.gc_maxlifetime', $lifetime);

$isSecure = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on';

$path = '/';
$domain = null; 
$secure = true; 
$httponly = true; 

session_set_cookie_params([
    'lifetime' => $lifetime,
    'path' => $path,
    'domain' => $domain,
    'secure' => $secure,
    'httponly' => $httponly,
    'samesite' => 'None'
]);

session_start();

// 3. The Login Logic
$loginHandler = asyncHandler(function() {
    
    // Get Input
    $data = json_decode(file_get_contents('php://input'), true);
    if (empty($data)) $data = $_POST; 

    $email = $data['email'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($email) || empty($password)) {
        throw new ApiError(400, "Email and password are required");
    }

    // 3. Admin Verification Logic
    // OPTION A: Hardcoded Admins (Recommended for small internal tools)
    $admins = [
        "admin@ethiccraft.org" => "AdminPass123", // Change these!
        "scan@ethiccraft.org"  => "Scanner2025"
    ];

    if (!isset($admins[$email]) || $admins[$email] !== $password) {
        throw new ApiError(401, "Invalid credentials. Access Denied.");
    }

    // Success: Set Session
    $_SESSION['admin_logged_in'] = true;
    $_SESSION['admin_email'] = $email;
    
    session_regenerate_id(true); // Prevent session fixation

    // Prepare Response Data
    $responseData = [
        "token" => session_id(), // The React app stores this as 'admin_token'
        "user" => [
            "name" => "Admin",
            "email" => $email
        ]
    ];

    // Send Standard Response
    (new ApiResponse(200, $responseData, "Login successful!"))->send();
});

// 4. Execute
$loginHandler();
?>