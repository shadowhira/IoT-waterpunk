const { SuccessResponse } = require("../core/success.response")
const firebaseTokenService = require("../services/firebaseToken.service")

class firebaseTokenController{
    upsertFirebaseToken = async(req, res, next)=>{
        new SuccessResponse({
            message:"upsert firebase token successfully",
            metadata: await firebaseTokenService.upsertFirebaseToken(req.body)
        }).send(res)
    }
}

module.exports = new firebaseTokenController()