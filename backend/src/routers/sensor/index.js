const express = require("express");
const { asyncHandle } = require("../../helpers/asyncHandle");
const sensorController = require("../../controllers/sensor.controller");
const router = express.Router();

// Lấy tất cả dữ liệu cảm biến với phân trang và lọc
router.get("/", asyncHandle(sensorController.getAllData));

module.exports = router;
