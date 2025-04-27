const mqtt = require("mqtt");
const readline = require("readline");

// ==== Cấu hình MQTT Broker ====
const MQTT_CONFIG = {
  server: "mqtt://172.20.10.2", // Địa chỉ MQTT Broker
  port: 2403, // Port MQTT Broker
  topics: {
    sensorData: "/sensor/data",
    control: "/sensor/control",
  },
};

// Trạng thái điều khiển
let controlMode = 2; // 0: Tắt thủ công, 1: Bật thủ công, 2: Tự động

// ==== Kết nối tới MQTT Broker ====
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

// ==== Xử lý message MQTT ====
client.on("message", (topic, message) => {
  try {
    const msg = message.toString();

    // Xử lý dữ liệu cảm biến
    if (topic === MQTT_CONFIG.topics.sensorData) {
      const data = JSON.parse(msg);
      console.log(`📊 Dữ liệu cảm biến:`);
      console.log(`- Nhiệt độ: ${data.temperature}°C`);
      console.log(`- TDS: ${data.tds} ppm`);
      console.log(`- Lưu lượng nước: ${data.flowRate} L/min`);
      console.log(`- Máy bơm: ${data.pumpState ? "ON" : "OFF"}`);
    }

    // Xử lý lệnh điều khiển máy bơm và chế độ
    if (topic === MQTT_CONFIG.topics.control) {
      if (msg === "on") {
        console.log("🔧 BẬT máy bơm (Thủ công).");
        controlMode = 1; // Chế độ bật thủ công
      } else if (msg === "off") {
        console.log("🔧 TẮT máy bơm (Thủ công).");
        controlMode = 0; // Chế độ tắt thủ công
      } else if (msg === "auto") {
        console.log("🔄 Chuyển sang chế độ TỰ ĐỘNG.");
        controlMode = 2; // Chế độ tự động
      } else {
        console.warn("⚠️ Lệnh không hợp lệ trên topic /sensor/control.");
      }
    }
  } catch (error) {
    console.error("❌ Lỗi khi xử lý message MQTT:", error);
  }
});

// ==== Nhập lệnh từ bàn phím ====
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt:
    'Nhập lệnh ("on"/"off" bật/tắt máy bơm, "auto" chuyển chế độ tự động): ',
});

rl.prompt();

rl.on("line", (line) => {
  const input = line.trim().toLowerCase();

  switch (input) {
    case "on":
    case "off":
    case "auto":
      // Gửi lệnh điều khiển máy bơm hoặc chuyển chế độ
      client.publish(MQTT_CONFIG.topics.control, input, {}, (err) => {
        if (err) {
          console.error(`❌ Lỗi khi gửi lệnh "${input}":`, err);
        } else {
          console.log(`✅ Gửi lệnh "${input}" thành công.`);
        }
      });
      break;

    default:
      console.log(
        '⚠️ Lệnh không hợp lệ. Vui lòng nhập "on", "off", hoặc "auto".'
      );
  }

  rl.prompt();
});

// ==== Xử lý sự kiện MQTT ====
client.on("error", (err) => {
  console.error("❌ Lỗi kết nối MQTT:", err);
});

client.on("offline", () => {
  console.warn("⚠️ MQTT Broker đã offline.");
});

client.on("close", () => {
  console.warn("⚠️ Kết nối tới MQTT Broker đã bị đóng.");
});
