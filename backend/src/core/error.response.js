const {
    ReasonPhrases,
    StatusCodes,
} = require("../utils/httpStatusCode.js")

class ErrorResponse extends Error{
    constructor (message, status){
        super(message)
        this.status = status
    }
}
class ConflictRequestError extends ErrorResponse{
    constructor(message = ReasonStatusCode.CONFLICT,status=StatusCodes.FORBIDDEN){
        super(message, status)
    }
}
class BadRequestError extends ErrorResponse{
    constructor(message = ReasonStatusCode.CONFLICT,status=StatusCodes.FORBIDDEN){
        super(message, status)
    }
}

class AuthFailureError extends ErrorResponse{
    constructor(message = ReasonPhrases.UNAUTHORIZED, StatusCode = StatusCodes.UNAUTHORIZED){
        super(message,StatusCode)
    }
}
class NotFoundError extends ErrorResponse{
    constructor(message = ReasonPhrases.NOT_FOUND, StatusCode = StatusCodes.NOT_FOUND){
        super(message,StatusCode)
    }
}
class ForbiddenError extends ErrorResponse{
    constructor(message = ReasonPhrases.FORBIDDEN, StatusCode = StatusCodes.FORBIDDEN){
        super(message,StatusCode)
    }
}
class INTERNAL_SERVER_ERROR extends ErrorResponse{
    constructor(message = ReasonPhrases.INTERNAL_SERVER_ERROR, StatusCode = StatusCodes.INTERNAL_SERVER_ERROR){
        super(message,StatusCode)
    }
}
module.exports = {
    AuthFailureError,
    ConflictRequestError, 
    BadRequestError,
    NotFoundError,
    ForbiddenError,
    INTERNAL_SERVER_ERROR
}