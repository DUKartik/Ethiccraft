<?php
class ApiError extends Exception {
    public $statusCode;
    public $data;
    public $success;
    public $errors;

    public function __construct($statusCode, $message = "Something went wrong", $errors = [], $stack = "") {
        parent::__construct($message);
        $this->statusCode = $statusCode;
        $this->data = null;
        $this->success = false;
        $this->errors = $errors;
    }
}
?>