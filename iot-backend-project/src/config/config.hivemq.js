const mqtt = require('mqtt');
const statsService = require('../services/stats.service');

// Thông tin MQTT broker
const brokerUrl = 'mqtt://localhost:2403'; // Thay 'localhost' bằng IP của broker nếu cần
const topic = 'sensor/data'; // Topic bạn muốn subscribe

const MQTT_CONFIG = {
  server: "mqtt://localhost", // Địa chỉ MQTT Broker
  port: 2403, // Port MQTT Broker
  topics: {
    sensorData: "/sensor/data",
    // control: "/sensor/control",
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
  console.log(`Dữ liệu nhận được từ topic "${topic}": ${message.toString()}`);
  const data = message.toString()
  console.log('data: ', data);
  if (global.wss) {
    global.wss.clients.forEach((client) => {
      if (client.readyState === 1) { // 1 = WebSocket.OPEN
        client.send(JSON.stringify({ topic, data })); // Gửi dữ liệu đến client
      }
    });
  }

  // Gọi hàm xử lý dữ liệu sensor
  statsService.handleSensorData(data);
});

// Xử lý lỗi kết nối
client.on('error', (err) => {
  console.error('Lỗi MQTT:', err);
});
// end test
module.exports = client