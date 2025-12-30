<?php

$allowed_origins = ['http://localhost:3000', 'http://localhost:3001'];

if (isset($_SERVER['HTTP_ORIGIN']) && in_array($_SERVER['HTTP_ORIGIN'], $allowed_origins)) {
    header("Access-Control-Allow-Origin: " . $_SERVER['HTTP_ORIGIN']);
} else {
    echo json_encode(["error" => "CORS policy: Origin not allowed."]);
    exit;
}

header('Content-Type: application/json');
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, GET, OPTIONS, DELETE, PUT");

header("Access-Control-Allow-Credentials: true");

ini_set('session.cookie_samesite', 'None');
ini_set('session.cookie_secure', '1');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config.php';
?>