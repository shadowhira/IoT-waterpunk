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
  try {
    console.log(`Nhận dữ liệu từ topic "${topic}"`);
    const data = message.toString();

    // Xử lý dữ liệu theo topic
    switch (topic) {
      case MQTT_CONFIG.topics.sensorData:
        // Gọi hàm xử lý dữ liệu sensor (hàm này sẽ gửi dữ liệu qua WebSocket)
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

      case MQTT_CONFIG.topics.control:
        // Xử lý phản hồi điều khiển
        console.log(`Nhận lệnh điều khiển: ${data}`);
        // Gửi thông báo qua WebSocket
        if (global.wss) {
          global.wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(JSON.stringify({
                topic: 'control_status',
                payload: { command: data, timestamp: new Date().toISOString() }
              }));
            }
          });
        }
        break;

      case MQTT_CONFIG.topics.level:
        // Xử lý phản hồi mức nước
        console.log(`Nhận mức nước mong muốn: ${data}`);
        // Gửi thông báo qua WebSocket
        if (global.wss) {
          global.wss.clients.forEach((client) => {
            if (client.readyState === 1) { // WebSocket.OPEN
              client.send(JSON.stringify({
                topic: 'level_status',
                payload: { level: parseInt(data), timestamp: new Date().toISOString() }
              }));
            }
          });
        }
        break;

      default:
        console.log(`Không có xử lý cho topic: ${topic}`);
    }
  } catch (error) {
    console.error(`Lỗi khi xử lý tin nhắn MQTT từ topic ${topic}:`, error);
  }
});

// Xử lý lỗi kết nối
client.on('error', (err) => {
  console.error('Lỗi MQTT:', err);
});
// end test
module.exports = client