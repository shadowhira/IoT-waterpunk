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

      // Chuẩn bị dữ liệu để gửi qua MQTT
      const mqttConfig = {
        tank_height: config.tank_height,
        max_temp: config.max_temp,
        max_tds: config.max_tds,
        leak_threshold: config.leak_threshold,
        flow_threshold: config.flow_threshold,
        alerts_enabled: config.alerts_enabled
      };

      // Gửi cấu hình mới qua MQTT để ESP32 cập nhật EEPROM
      if (global.client && global.client.connected) {
        console.log('Gửi cấu hình mới tới ESP32:', mqttConfig);
        global.client.publish('/sensor/config', JSON.stringify(mqttConfig), { qos: 1 }, (err) => {
          if (err) {
            console.error("Lỗi khi gửi cấu hình qua MQTT:", err);
          } else {
            console.log("Đã gửi cấu hình thành công qua MQTT");
          }
        });
      } else {
        console.error("MQTT client không khả dụng hoặc chưa kết nối");
      }

      return config;
    } catch (error) {
      console.error("Lỗi khi cập nhật cấu hình:", error);
      throw error;
    }
  };

  static getConfig = async (deviceId = "default") => {
    try {
      const config = await configService.getConfig(deviceId);
      console.log('Retrieved config:', config);
      return config;
    } catch (error) {
      console.error('Error in system.service.getConfig:', error);
      throw error;
    }
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
