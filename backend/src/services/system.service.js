const SensorData = require("../models/sensorData.model");
const topic = "/sensor/control";
const topic1 = "/sensor/level";
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
  };
  static setWaterStorage = async (data) => {
    global.client.publish(topic1, data, function (err) {
      if (err) {
        console.error("Error publishing message:", err);
      } else {
        console.log(`Message published to topic: ${topic1} with data: ${data}`);
      }
    });
  };
}

module.exports = systemService;
