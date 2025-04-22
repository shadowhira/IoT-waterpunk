const { SuccessResponse } = require("../core/success.response");
const systemService = require("../services/system.service");

class ConfigController {
  getConfig = async (req, res, next) => {
    try {
      const deviceId = req.query.deviceId || "default";
      const config = await systemService.getConfig(deviceId);
      
      new SuccessResponse({
        message: "Get system configuration",
        metadata: config
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
  
  updateConfig = async (req, res, next) => {
    try {
      const configData = req.body;
      const deviceId = req.query.deviceId || "default";
      
      const updatedConfig = await systemService.updateConfig(configData, deviceId);
      
      new SuccessResponse({
        message: "System configuration updated",
        metadata: updatedConfig
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
  
  resetLeak = async (req, res, next) => {
    try {
      const result = await systemService.resetLeak();
      
      new SuccessResponse({
        message: "Leak alert reset command sent",
        metadata: result
      }).send(res);
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new ConfigController();
