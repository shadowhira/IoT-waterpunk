const express = require("express");
const router = express.Router();

// Các routes hiện có
router.use("/alert", require("./alerts"))
router.use("/billing", require("./billings"))
router.use("/firebase", require("./firebase"))
router.use("/data", require("./stats"))
router.use("/system", require("./system"))

// Route mới cho cấu hình hệ thống
router.use("/config", require("./config"))

// Route mới cho dữ liệu cảm biến
router.use("/sensor-data", require("./sensor"))

module.exports = router;