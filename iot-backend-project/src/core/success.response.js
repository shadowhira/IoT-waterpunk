const StatusCodes = {
    OK:200,
    CREATED:201
}
const ReasonStatusCodes={
    OK:'Success',
    CREATED:'Created'
}
class SuccessResponse{
    constructor({message, StatusCode = StatusCodes.OK, ReasonStatusCode = ReasonStatusCodes.OK, metadata = {}}){
        this.message = !message ? ReasonStatusCode : message
        this.status = StatusCode,
        this.metadata = metadata
    }
    send(res, headers={}){
        return res.status(this.status).json(this)
    }
}

class OK extends SuccessResponse{
    constructor({message, metadata}){
        super({message, metadata})
    }
}

class CREATED extends SuccessResponse{
    constructor({options = {},message, StatusCode = StatusCodes.CREATED, ReasonStatusCode = ReasonStatusCodes.CREATED,metadata}){
        super({message, StatusCode,ReasonStatusCode,metadata})
        this.options = options
    }
}

module.exports ={
    OK,
    CREATED,
    SuccessResponse
}
