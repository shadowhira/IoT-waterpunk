const { NotFoundError } = require("../core/error.response");
const SensorData = require("../models/sensorData.model");
const alertService = require("../services/alert.service");
const systemService = require("./system.service");
const sensorData = require("../models/sensorData.model");

const checkThresholds = async (data) => {
  // Sử dụng biến toàn cục để lưu trạng thái bơm
  if (global.lastPumpStatus === undefined) {
    global.lastPumpStatus = null; // Khởi tạo trạng thái nếu chưa tồn tại
  }

  // Kiểm tra trạng thái bơm và gửi thông báo nếu thay đổi
  if (data.pumpState === 1 && global.lastPumpStatus !== 1) {
    global.lastPumpStatus = 1;
    // Gửi thông báo bật máy bơm
    sendNotification("Nước sạch hoặc bể chưa đầy, bật lại máy bơm");
  } else if (data.pumpState === 0 && global.lastPumpStatus !== 0) {
    global.lastPumpStatus = 0;
    // Gửi thông báo tắt máy bơm
    sendNotification("Chất lượng nước không đạt hoặc bể đầy, tắt máy bơm");
  }

  // Kiểm tra các ngưỡng giá trị khác và tạo cảnh báo
  if (data.tds > 500) {
    createAlert(
      "Cảnh báo độ đục vượt ngưỡng",
      `Cảm biến đo độ đục vượt ngưỡng! Giá trị: ${data.tds}`,
      "Cảm biến độ đục"
    );
  } else if (data.temperature > 35) {
    createAlert(
      "Cảnh báo nhiệt độ nước vượt ngưỡng",
      `Nhiệt độ vượt ngưỡng! Giá trị: ${data.temperature}`,
      "Cảm biến nhiệt độ"
    );
  }

  // Lưu dữ liệu vào MongoDB
  const newData = new SensorData(data);
  return await newData.save();
};

// Hàm gửi thông báo qua WebSocket
const sendNotification = (message) => {
  if (global.wss) {
    global.wss.clients.forEach((client) => {
      if (client.readyState === 1) {
        // WebSocket.OPEN
        const notifi = JSON.stringify({
          topic: "notification",
          message: message,
        });
        console.log("notifi: ", notifi);
        client.send(notifi);
      }
    });
  }
};

const createAlert = (alertType, message, device) => {
  console.log("message: ", message);
  alertService.createAlert({
    alert_type: alertType,
    message: message,
    device: device,
  });
};

class statsService {
  // Xử lý dữ liệu từ sensor
  static handleSensorData = async (data) => {
    // console.log('data: ', data);
    // if (typeof data === 'string') {

    //     return;
    // }
    data = await JSON.parse(data); // Parse nếu dữ liệu là string
    await checkThresholds(data);
  };

  // Lấy tất cả dữ liệu sensor
  static getAllData = async (req) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const data = await SensorData.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createAt: -1 });

    const total = await SensorData.countDocuments();
    return {
      data: data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  };
}

module.exports = statsService;
