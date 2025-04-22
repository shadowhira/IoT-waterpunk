const express = require("express")
const {asyncHandle} = require("../../helpers/asyncHandle");
const configController = require("../../controllers/config.controller");
const router = express.Router();

// Lấy cấu hình hệ thống
router.get("/", asyncHandle(configController.getConfig))

// Cập nhật cấu hình hệ thống
router.put("/", asyncHandle(configController.updateConfig))

// Đặt lại cảnh báo rò rỉ
router.post("/reset-leak", asyncHandle(configController.resetLeak))

module.exports = router
