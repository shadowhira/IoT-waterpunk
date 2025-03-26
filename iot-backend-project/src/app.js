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
wss.on("connection", (ws) => {
  console.log("A user connected");

  // Gửi thông điệp chào mừng
  ws.send(JSON.stringify({ message: "Welcome to WebSocket server!" }));

  // Lắng nghe tin nhắn từ client
  ws.on("message", (message) => {
    console.log("Received message from client:", message);

    // Gửi phản hồi
    ws.send(JSON.stringify({ serverResponse: "Message received" }));
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
