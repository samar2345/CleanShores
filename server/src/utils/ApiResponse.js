// server/src/utils/ApiResponse.js
class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode;
        this.data = data;
        this.message = message;
        this.success = statusCode < 400; // Convention: success if status code is less than 400
    }
}

export { ApiResponse };