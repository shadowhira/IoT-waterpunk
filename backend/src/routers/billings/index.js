const express = require("express")
const {asyncHandle} = require("../../helpers/asyncHandle");
const billingController = require("../../controllers/billing.controller");
const router = express.Router();
router.post("/create_payment_url", asyncHandle(billingController.createPayment))
router.get("/vnpay_ipn", asyncHandle(billingController.vnpayIPN))
router.get("/vnpay_return", asyncHandle(billingController.vnpayReturn))


module.exports = router