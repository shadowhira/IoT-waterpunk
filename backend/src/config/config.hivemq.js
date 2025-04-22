const mqtt = require('mqtt');
const statsService = require('../services/stats.service');

// Thông tin MQTT broker từ biến môi trường
const MQTT_CONFIG = {
  server: `mqtt://${process.env.MQTT_BROKER_URL || 'localhost'}`,
  port: parseInt(process.env.MQTT_BROKER_PORT || '2403'),
  topics: {
    sensorData: process.env.MQTT_TOPIC_SENSOR_DATA || "/sensor/data",
    control: process.env.MQTT_TOPIC_CONTROL || "/sensor/control",
    level: process.env.MQTT_TOPIC_LEVEL || "/sensor/level",
    config: process.env.MQTT_TOPIC_CONFIG || "/sensor/config",
    configStatus: process.env.MQTT_TOPIC_CONFIG_STATUS || "/sensor/config/status",
    leakAlert: process.env.MQTT_TOPIC_LEAK_ALERT || "/sensor/leak/alert"
  },
};

// Kết nối tới broker
const client = mqtt.connect(MQTT_CONFIG.server, {
  port: MQTT_CONFIG.port,
});

client.on("connect", () => {
  console.log("✅ Kết nối thành công tới MQTT Broker");

  // Subscribe các topic cần thiết
  const topics = Object.values(MQTT_CONFIG.topics);
  client.subscribe(topics, (err) => {
    if (err) {
      console.error("❌ Lỗi khi subscribe tới các topic:", err);
    } else {
      console.log(`📥 Subscribed tới các topic: ${topics.join(", ")}`);
    }
  });
});

// Lắng nghe dữ liệu từ topic
client.on('message', (topic, message) => {
  // console.log(`Dữ liệu nhận được từ topic "${topic}": ${message.toString()}`);
  const data = message.toString();
  // console.log('data: ', data);

  // Xử lý dữ liệu theo topic
  switch (topic) {
    case MQTT_CONFIG.topics.sensorData:
      // Gửi dữ liệu đến clients qua WebSocket
      if (global.wss) {
        global.wss.clients.forEach((client) => {
          if (client.readyState === 1) { // 1 = WebSocket.OPEN
            client.send(JSON.stringify({ topic: 'sensor_data', data })); // Gửi dữ liệu đến client
          }
        });
      }

      // Gọi hàm xử lý dữ liệu sensor
      statsService.handleSensorData(data);
      break;

    case MQTT_CONFIG.topics.configStatus:
      // Xử lý cập nhật cấu hình
      const configService = require('../services/config.service');
      configService.handleConfigUpdate(data);
      break;

    case MQTT_CONFIG.topics.leakAlert:
      // Xử lý cảnh báo rò rỉ
      const alertService = require('../services/alert.service');
      alertService.handleLeakAlert(data);
      break;

    default:
      console.log(`Không có xử lý cho topic: ${topic}`);
  }
});

// Xử lý lỗi kết nối
client.on('error', (err) => {
  console.error('Lỗi MQTT:', err);
});
// end test
module.exports = client