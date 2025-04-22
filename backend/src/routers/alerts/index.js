const express = require("express")
const {asyncHandle} = require("../../helpers/asyncHandle");
const alertController = require("../../controllers/alert.controller");
const router = express.Router();

// Lấy tất cả cảnh báo
router.get("/", asyncHandle(alertController.getAllAlert))

// Lấy các cảnh báo đang hoạt động
router.get("/active", asyncHandle(alertController.getActiveAlerts))

// Đặt lại cảnh báo
router.put("/resolve/:alertId", asyncHandle(alertController.resolveAlert))

module.exports = router