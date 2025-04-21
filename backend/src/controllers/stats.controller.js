const { SuccessResponse } = require("../core/success.response")
const statsService = require("../services/stats.service")
const waterUsage = require("../services/waterUsage.service")

class statsController{
    getallData = async(req, res, next)=>{
        new SuccessResponse({
            message:"get all stats completed",
            metadata: await statsService.getAllData(req)
        }).send(res)
    }
    waterUsage = async(req, res, next)=>{
        new SuccessResponse({
            message:"get water Usage",
            metadata: await waterUsage.calculateWaterUsage()
        }).send(res)
    }
}
module.exports = new statsController()