const { SuccessResponse } = require("../core/success.response")
const alertService = require("../services/alert.service")

class alertController{
    getAllAlert = async(req, res, next)=>{
        new SuccessResponse({
            message:"get all alert",
            metadata: await alertService.getAllAlert()
        }).send(res)
    }

    getActiveAlerts = async(req, res, next)=>{
        new SuccessResponse({
            message:"get active alerts",
            metadata: await alertService.getActiveAlerts()
        }).send(res)
    }

    resolveAlert = async(req, res, next)=>{
        const { alertId } = req.params;

        try {
            const result = await alertService.resolveAlert(alertId);
            new SuccessResponse({
                message:"alert resolved",
                metadata: result
            }).send(res);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new alertController()