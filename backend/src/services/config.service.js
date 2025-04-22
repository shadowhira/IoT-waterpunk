const SystemConfig = require("../models/systemConfig.model");

class ConfigService {
  // Lấy cấu hình hiện tại
  static getConfig = async (deviceId = "default") => {
    let config = await SystemConfig.findOne({ device_id: deviceId });
    
    // Nếu không tìm thấy, tạo cấu hình mặc định
    if (!config) {
      config = await SystemConfig.create({
        device_id: deviceId,
        tank_height: 15.0,
        max_temp: 35.0,
        max_tds: 500.0,
        leak_threshold: 0.5,
        flow_threshold: 0.2,
        pump_timeout: 300
      });
    }
    
    return config;
  };

  // Cập nhật cấu hình
  static updateConfig = async (configData, deviceId = "default") => {
    // Tìm và cập nhật cấu hình, hoặc tạo mới nếu không tồn tại
    const config = await SystemConfig.findOneAndUpdate(
      { device_id: deviceId },
      { $set: configData },
      { new: true, upsert: true }
    );
    
    // Gửi cấu hình mới qua MQTT
    if (global.client) {
      global.client.publish(
        "/sensor/config",
        JSON.stringify(config.toObject()),
        (err) => {
          if (err) {
            console.error("Error publishing config:", err);
          } else {
            console.log("Config published to MQTT");
          }
        }
      );
    }
    
    // Gửi thông báo qua WebSocket
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            topic: "config",
            payload: config.toObject()
          }));
        }
      });
    }
    
    return config;
  };
  
  // Xử lý cấu hình từ MQTT
  static handleConfigUpdate = async (data) => {
    try {
      if (typeof data === 'string') {
        data = JSON.parse(data);
      }
      
      // Cập nhật cấu hình trong database
      const config = await this.updateConfig(data);
      
      return config;
    } catch (error) {
      console.error("Error handling config update:", error);
      throw error;
    }
  };
}

module.exports = ConfigService;
