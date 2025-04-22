const SensorData = require("../models/sensorData.model");
const SystemConfig = require("../models/systemConfig.model");
const configService = require("./config.service");

const topic = "/sensor/control";
const topic1 = "/sensor/level";
const configTopic = "/sensor/config";

class systemService {
  static turnOnOff = async (data, message) => {
    // Gửi lệnh điều khiển qua MQTT
    global.client.publish(topic, data, function (err) {
      if (err) {
        console.error("Error publishing message:", err);
      } else {
        console.log(`Message published to topic: ${topic} with data: ${data}`);
      }
    });

    // Gửi thông báo qua WebSocket
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            topic: "control",
            payload: { action: data, message }
          }));
        }
      });
    }
  };

  static setWaterStorage = async (data) => {
    global.client.publish(topic1, data, function (err) {
      if (err) {
        console.error("Error publishing message:", err);
      } else {
        console.log(`Message published to topic: ${topic1} with data: ${data}`);
      }
    });

    // Gửi thông báo qua WebSocket
    if (global.wss) {
      global.wss.clients.forEach((client) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify({
            topic: "level",
            payload: { level: data }
          }));
        }
      });
    }
  };

  static updateConfig = async (configData, deviceId = "default") => {
    try {
      // Cập nhật cấu hình trong database
      const config = await configService.updateConfig(configData, deviceId);

      // Gửi cấu hình mới qua MQTT
      global.client.publish(configTopic, JSON.stringify(config), function (err) {
        if (err) {
          console.error("Error publishing config:", err);
        } else {
          console.log(`Config published to topic: ${configTopic}`);
        }
      });

      return config;
    } catch (error) {
      console.error("Error updating config:", error);
      throw error;
    }
  };

  static getConfig = async (deviceId = "default") => {
    return await configService.getConfig(deviceId);
  };

  static resetLeak = async () => {
    try {
      // Đặt lại cảnh báo rò rỉ trong database
      const alertService = require('./alert.service');
      const result = await alertService.handleLeakAlert({ type: 'leak_reset' });

      // Gửi lệnh reset cảnh báo rò rỉ qua MQTT
      return new Promise((resolve, reject) => {
        global.client.publish(topic, "reset_leak", function (err) {
          if (err) {
            console.error("Error publishing reset_leak command:", err);
            reject({ success: false, message: "Failed to reset leak alert" });
          } else {
            console.log("Reset leak command published");
            resolve({ success: true, message: "Leak alert reset command sent", result });
          }
        });
      });
    } catch (error) {
      console.error("Error resetting leak alert:", error);
      throw error;
    }
  };
}

module.exports = systemService;
