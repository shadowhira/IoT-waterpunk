const { SuccessResponse } = require("../core/success.response")
const alertService = require("../services/alert.service")

class alertController{
    getAllAlert = async(req, res, next)=>{
        new SuccessResponse({
            message:"get all alert",
            metadata: await alertService.getAllAlert()
        }).send(res)
    }
}

module.exports = new alertController()