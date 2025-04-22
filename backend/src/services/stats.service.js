const { NotFoundError } = require("../core/error.response");
const SensorData = require("../models/sensorData.model");
const alertService = require("../services/alert.service");
const systemService = require("./system.service");
const configService = require("./config.service");
const sensorData = require("../models/sensorData.model");

const checkThresholds = async (data) => {
  // Lấy cấu hình hiện tại
  const config = await configService.getConfig();

  // Sử dụng biến toàn cục để lưu trạng thái bơm
  if (global.lastPumpStatus === undefined) {
    global.lastPumpStatus = null; // Khởi tạo trạng thái nếu chưa tồn tại
  }

  // Lưu trạng thái bơm trước đó
  if (global.pumpStartTime === undefined) {
    global.pumpStartTime = 0;
  }

  // Kiểm tra trạng thái bơm và gửi thông báo nếu thay đổi
  if (data.pumpState === 1 && global.lastPumpStatus !== 1) {
    global.lastPumpStatus = 1;
    global.pumpStartTime = Date.now(); // Ghi nhận thời điểm bắt đầu bơm
    // Gửi thông báo bật máy bơm
    sendNotification("Nước sạch hoặc bể chưa đầy, bật lại máy bơm");
  } else if (data.pumpState === 0 && global.lastPumpStatus !== 0) {
    global.lastPumpStatus = 0;
    global.pumpStartTime = 0; // Đặt lại thời gian bơm
    // Gửi thông báo tắt máy bơm
    sendNotification("Chất lượng nước không đạt hoặc bể đầy, tắt máy bơm");
  }

  // Kiểm tra rò rỉ
  if (data.leakDetected === 1 && !global.leakDetected) {
    global.leakDetected = true;
    // Tạo cảnh báo rò rỉ
    createAlert(
      "Cảnh báo rò rỉ nước",
      `Phát hiện rò rỉ nước! Loại: ${data.leakType}`,
      "Hệ thống nước",
      data.leakType
    );
  } else if (data.leakDetected === 0 && global.leakDetected) {
    global.leakDetected = false;
  }

  // Kiểm tra các ngưỡng giá trị khác và tạo cảnh báo
  if (data.tds > config.max_tds) {
    createAlert(
      "Cảnh báo độ đục vượt ngưỡng",
      `Cảm biến đo độ đục vượt ngưỡng! Giá trị: ${data.tds}, Ngưỡng: ${config.max_tds}`,
      "Cảm biến độ đục"
    );
  } else if (data.temperature > config.max_temp) {
    createAlert(
      "Cảnh báo nhiệt độ nước vượt ngưỡng",
      `Nhiệt độ vượt ngưỡng! Giá trị: ${data.temperature}, Ngưỡng: ${config.max_temp}`,
      "Cảm biến nhiệt độ"
    );
  }

  // Kiểm tra thời gian bơm quá lâu
  if (data.pumpState === 1 && global.pumpStartTime > 0) {
    const pumpDuration = (Date.now() - global.pumpStartTime) / 1000; // Thời gian bơm tính bằng giây
    if (pumpDuration > config.pump_timeout) {
      // Tạo cảnh báo bơm quá lâu
      createAlert(
        "Cảnh báo máy bơm hoạt động quá lâu",
        `Máy bơm đã hoạt động liên tục ${Math.round(pumpDuration)} giây, vượt quá ngưỡng ${config.pump_timeout} giây`,
        "Máy bơm",
        3,
        pumpDuration
      );

      // Gửi lệnh tắt máy bơm
      systemService.turnOnOff("off", "Tắt máy bơm do hoạt động quá lâu");
    }
  }

  // Thêm timestamp nếu chưa có
  if (!data.timestamp) {
    data.timestamp = new Date();
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

const createAlert = (alertType, message, device, leak_type = 0, value = 0) => {
  console.log("message: ", message);
  alertService.createAlert({
    alert_type: alertType,
    message: message,
    device: device,
    leak_type: leak_type,
    value: value
  });
};

class statsService {
  // Xử lý dữ liệu từ sensor
  static handleSensorData = async (data) => {
    try {
      // Đảm bảo dữ liệu là object
      let sensorData;
      if (typeof data === 'string') {
        sensorData = JSON.parse(data);
      } else {
        sensorData = data;
      }

      // Kiểm tra và chuẩn hóa dữ liệu
      const validatedData = {
        temperature: parseFloat(sensorData.temperature) || 0,
        tds: parseFloat(sensorData.tds) || 0,
        flowRate: parseFloat(sensorData.flowRate) || 0,
        distance: parseFloat(sensorData.distance) || 0,
        pumpState: parseInt(sensorData.pumpState) || 0,
        currentLevelPercent: parseFloat(sensorData.currentLevelPercent) || 0,
        leakDetected: parseInt(sensorData.leakDetected) || 0,
        leakType: parseInt(sensorData.leakType) || 0
      };

      // Gửi dữ liệu đã chuẩn hóa đến WebSocket
      if (global.wss) {
        global.wss.clients.forEach((client) => {
          if (client.readyState === 1) { // WebSocket.OPEN
            client.send(JSON.stringify({
              topic: 'sensor_data',
              payload: validatedData
            }));
          }
        });
      }

      // Xử lý dữ liệu
      await checkThresholds(validatedData);

      return validatedData;
    } catch (error) {
      console.error('Lỗi khi xử lý dữ liệu cảm biến:', error);
      return null;
    }
  };

  // Lấy tất cả dữ liệu sensor với phân trang và lọc
  static getAllData = async (req) => {
    try {
      // Lấy các tham số phân trang
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const skip = (page - 1) * limit;

      // Xây dựng điều kiện lọc
      const filter = {};

      // Lọc theo ngày
      if (req.query.startDate) {
        filter.createdAt = { $gte: new Date(req.query.startDate) };
      }

      if (req.query.endDate) {
        filter.createdAt = { ...filter.createdAt, $lte: new Date(req.query.endDate) };
      }

      // Lọc theo nhiệt độ
      if (req.query.minTemp) {
        filter.temperature = { $gte: parseFloat(req.query.minTemp) };
      }

      if (req.query.maxTemp) {
        filter.temperature = { ...filter.temperature, $lte: parseFloat(req.query.maxTemp) };
      }

      // Lọc theo TDS
      if (req.query.minTds) {
        filter.tds = { $gte: parseFloat(req.query.minTds) };
      }

      if (req.query.maxTds) {
        filter.tds = { ...filter.tds, $lte: parseFloat(req.query.maxTds) };
      }

      // Lọc theo trạng thái máy bơm
      if (req.query.pumpState && req.query.pumpState !== 'all') {
        filter.pumpState = parseInt(req.query.pumpState);
      }

      // Lấy dữ liệu từ database
      const data = await SensorData.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

      // Đếm tổng số bản ghi thỏa mãn điều kiện lọc
      const total = await SensorData.countDocuments(filter);

      return {
        data: data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error getting sensor data:', error);
      throw error;
    }
  };
}

module.exports = statsService;
