class ErrorResponse extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";
    }
}

class BadRequestError extends ErrorResponse {
    constructor(message = "Bad Request") {
        super(message, 400);
    }
}

class UnauthorizedError extends ErrorResponse {
    constructor(message = "Unauthorized") {
        super(message, 401);
    }
}

class ForbiddenError extends ErrorResponse {
    constructor(message = "Forbidden") {
        super(message, 403);
    }
}

class NotFoundError extends ErrorResponse {
    constructor(message = "Not Found") {
        super(message, 404);
    }
}

class ConflictError extends ErrorResponse {
    constructor(message = "Conflict") {
        super(message, 409);
    }
}

class InternalServerError extends ErrorResponse {
    constructor(message = "Internal Server Error") {
        super(message, 500);
    }
}

export {
    ErrorResponse,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    InternalServerError,
};
