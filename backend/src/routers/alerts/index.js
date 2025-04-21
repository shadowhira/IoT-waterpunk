const express = require("express")
const {asyncHandle} = require("../../helpers/asyncHandle");
const alertController = require("../../controllers/alert.controller");
const router = express.Router();
router.get("/", asyncHandle(alertController.getAllAlert))


module.exports = router