const SystemConfig = require("../models/systemConfig.model");
require('dotenv').config();

class ConfigService {
  // Lấy cấu hình hiện tại
  static getConfig = async (deviceId = "default") => {
    try {
      let config = await SystemConfig.findOne({ device_id: deviceId });

      // Nếu không tìm thấy, tạo cấu hình mặc định
      if (!config) {
        console.log('Creating default config for device:', deviceId);
        config = await SystemConfig.create({
          device_id: deviceId,
          tank_height: parseFloat(process.env.DEFAULT_TANK_HEIGHT || '15.0'),
          max_temp: parseFloat(process.env.DEFAULT_MAX_TEMP || '35.0'),
          max_tds: parseFloat(process.env.DEFAULT_MAX_TDS || '500.0'),
          leak_threshold: parseFloat(process.env.DEFAULT_LEAK_THRESHOLD || '0.5'),
          flow_threshold: parseFloat(process.env.DEFAULT_FLOW_THRESHOLD || '0.2'),
          alerts_enabled: process.env.DEFAULT_ALERTS_ENABLED === 'true'
        });
      }

      // console.log('Retrieved config from DB:', config.toObject());
      return config.toObject();
    } catch (error) {
      console.error('Error in config.service.getConfig:', error);
      throw error;
    }
  };

  // Cập nhật cấu hình
  static updateConfig = async (configData, deviceId = "default") => {
    console.log('Cập nhật cấu hình:', configData);
    
    // Đảm bảo alerts_enabled là boolean
    if (configData.alerts_enabled !== undefined) {
      configData.alerts_enabled = Boolean(configData.alerts_enabled);
    }

    // Tìm và cập nhật cấu hình, hoặc tạo mới nếu không tồn tại
    const config = await SystemConfig.findOneAndUpdate(
      { device_id: deviceId },
      { $set: configData },
      { new: true, upsert: true }
    );

    console.log('Đã lưu cấu hình vào DB:', config.toObject());

    // Gửi cấu hình mới qua MQTT
    if (global.client) {
      const configMsg = JSON.stringify(config.toObject());
      console.log('Gửi cấu hình qua MQTT:', configMsg);
      
      global.client.publish(
        process.env.MQTT_TOPIC_CONFIG || "/sensor/config",
        configMsg,
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
