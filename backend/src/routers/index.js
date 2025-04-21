const express = require("express");
const router = express.Router();
router.use("/alert", require("./alerts"))
router.use("/billing", require("./billings"))
router.use("/firebase", require("./firebase"))
router.use("/data", require("./stats"))
router.use("/system", require("./system"))


module.exports = router;