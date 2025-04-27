// server.js
const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const compression = require("compression");
const client = require("./config/config.hivemq");
const admin = require("./config/config.firebase");
const cors = require("cors")
require("dotenv").config();
const http = require("http")
const {WebSocketServer} = require("ws")
const app = express();
// init middleware
app.use(cors())
app.use(morgan("dev"));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Khởi tạo server và io
require("./dbs/init.database");

const server = http.createServer(app);

// Tích hợp WebSocket
const wss = new WebSocketServer({ server });

// Lắng nghe kết nối WebSocket
wss.on("connection", async (ws) => {
  console.log("A user connected");

  try {
    // Gửi thông điệp chào mừng
    ws.send(JSON.stringify({ message: "Welcome to WebSocket server!" }));

    // Gửi trạng thái cảnh báo rò rỉ hiện tại
    const alertService = require('./services/alert.service');
    const activeAlerts = await alertService.getActiveAlerts();

    // Tìm cảnh báo rò rỉ đang hoạt động
    const leakAlert = activeAlerts.find(alert => alert.leak_type > 0);

    if (leakAlert) {
      // Nếu có cảnh báo rò rỉ đang hoạt động
      ws.send(JSON.stringify({
        topic: 'leak',
        payload: {
          detected: true,
          type: leakAlert.leak_type,
          timestamp: leakAlert.createdAt,
          details: leakAlert
        }
      }));
    } else {
      // Nếu không có cảnh báo rò rỉ
      ws.send(JSON.stringify({
        topic: 'leak',
        payload: {
          detected: false,
          type: 0,
          timestamp: null,
          details: null
        }
      }));
    }

    // Gửi cấu hình hệ thống hiện tại
    const systemService = require('./services/system.service');
    const config = await systemService.getConfig();

    ws.send(JSON.stringify({
      topic: 'config',
      payload: config
    }));
  } catch (error) {
    console.error('Lỗi khi gửi dữ liệu ban đầu:', error);
  }

  // Lắng nghe tin nhắn từ client
  ws.on("message", (message) => {
    try {
      console.log("Received message from client:", message.toString());
      const data = JSON.parse(message.toString());

      // Xử lý tin nhắn theo topic
      if (data.topic === 'config' && data.payload) {
        // Xử lý cập nhật cấu hình
        const systemService = require('./services/system.service');
        systemService.updateConfig(data.payload)
          .then(updatedConfig => {
            console.log('Cấu hình đã được cập nhật:', updatedConfig);
            // Gửi phản hồi thành công
            ws.send(JSON.stringify({
              topic: 'config_response',
              payload: {
                success: true,
                message: 'Cấu hình đã được cập nhật thành công',
                config: updatedConfig
              }
            }));
          })
          .catch(error => {
            console.error('Lỗi khi cập nhật cấu hình:', error);
            // Gửi phản hồi lỗi
            ws.send(JSON.stringify({
              topic: 'config_response',
              payload: {
                success: false,
                message: 'Lỗi khi cập nhật cấu hình: ' + error.message
              }
            }));
          });
      } else if (data.topic === 'control' && data.payload) {
        // Xử lý lệnh điều khiển máy bơm
        const systemService = require('./services/system.service');
        systemService.turnOnOff(data.payload, 'Lệnh từ WebSocket');

        // Gửi phản hồi
        ws.send(JSON.stringify({
          topic: 'control_response',
          payload: {
            success: true,
            message: 'Lệnh điều khiển đã được gửi',
            command: data.payload
          }
        }));
      } else if (data.topic === 'level' && data.payload) {
        // Xử lý cập nhật mức nước mong muốn
        const systemService = require('./services/system.service');
        systemService.setWaterStorage(data.payload);

        // Gửi phản hồi
        ws.send(JSON.stringify({
          topic: 'level_response',
          payload: {
            success: true,
            message: 'Mức nước mong muốn đã được cập nhật',
            level: data.payload
          }
        }));
      } else if (data.topic === 'reset_leak' && data.payload) {
        // Xử lý đặt lại cảnh báo rò rỉ
        const systemService = require('./services/system.service');
        systemService.resetLeak()
          .then(result => {
            // Gửi phản hồi
            ws.send(JSON.stringify({
              topic: 'reset_leak_response',
              payload: {
                success: true,
                message: 'Lệnh đặt lại cảnh báo rò rỉ đã được gửi'
              }
            }));
          });
      } else if (data.topic === 'get_config') {
        const systemService = require('./services/system.service');
        try {
          const config = systemService.getConfig(data.payload.deviceId || 'default');
          ws.send(JSON.stringify({
            topic: 'config',
            payload: config
          }));
        } catch (error) {
          console.error('Error getting config:', error);
          ws.send(JSON.stringify({
            topic: 'error',
            payload: {
              message: 'Failed to get configuration',
              error: error.message
            }
          }));
        }
      } else {
        // Gửi phản hồi cho các tin nhắn khác
        ws.send(JSON.stringify({
          topic: 'response',
          payload: {
            message: 'Tin nhắn đã được nhận',
            originalTopic: data.topic || 'unknown'
          }
        }));
      }
    } catch (error) {
      console.error('Lỗi khi xử lý tin nhắn WebSocket:', error);
      // Gửi phản hồi lỗi
      ws.send(JSON.stringify({
        topic: 'error',
        payload: {
          message: 'Lỗi khi xử lý tin nhắn: ' + error.message
        }
      }));
    }
  });

  // Lắng nghe khi kết nối đóng
  ws.on("close", () => {
    console.log("A user disconnected");
  });

  // Xử lý lỗi
  ws.on("error", (err) => {
    console.error("WebSocket error:", err);
  });
});

global.wss = wss
// Định tuyến
app.use("/api/v1", require("./routers"));

// Xử lý lỗi
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use((err, req, res, next) => {
    const status = err.status || 500;
    return res.status(status).json({
        status: 'error',
        code: status,
        stack: err.stack,
        message: err.message || "Internal Server Error"
    });
});

client;
admin;
global.client = client
// Export cả `app`, `server` và `io`
module.exports = { app, server };
