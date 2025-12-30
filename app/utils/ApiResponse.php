<?php
class ApiResponse {
    public $statusCode;
    public $data;
    public $message;
    public $success;

    public function __construct($statusCode, $data, $message = "Success") {
        $this->statusCode = $statusCode;
        $this->data = $data;
        $this->message = $message;
        $this->success = $statusCode < 400;
    }

    public function send() {
        http_response_code($this->statusCode);
        echo json_encode([
            "statusCode" => $this->statusCode,
            "data" => $this->data,
            "message" => $this->message,
            "success" => $this->success
        ]);
        exit; // Stop script execution after sending
    }
}
?>