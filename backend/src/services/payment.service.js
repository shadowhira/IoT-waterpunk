const moment = require("moment");
const Payment = require("../models/payment.model");
const qs = require("qs");
const crypto = require("crypto");
require("dotenv").config();

const sortObject = (obj) => {
    const sortedKeys = Object.keys(obj).sort();
    const sortedObj = {};
    sortedKeys.forEach((key) => {
        sortedObj[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
    });
    return sortedObj;
};

const generateSignature = (params, secretKey) => {
    const signData = qs.stringify(params, { encode: false });
    const hmac = crypto.createHmac("sha512", secretKey);
    return hmac.update(Buffer.from(signData, "utf-8")).digest("hex");
};

const validateSignature = (params, secureHash, secretKey) => {
    const signed = generateSignature(params, secretKey);
    return secureHash === signed;
};

class PaymentService {
    static async createPaymentUrl(req, res) {
        try {
            const ipAddr =
                req.headers["x-forwarded-for"] ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress;

            const { VNP_TMN_CODE, VNP_HASH_SECRET, VNP_URL, VNP_RETURN_URL } =
                process.env;

            const { billing_period, amount_due, bankCode, language, order } =
                req.body;

            const paymentData = {
                billing_period,
                amount_due,
                status: "pending",
            };

            const newPayment = await Payment.create(paymentData);
            const createDate = moment().format("YYYYMMDDHHmmss");
            const newPaymentId = newPayment._id;

            const vnp_Params = {
                vnp_Version: "2.1.0",
                vnp_Command: "pay",
                vnp_TmnCode: VNP_TMN_CODE,
                vnp_Locale: language || "vn",
                vnp_CurrCode: "VND",
                vnp_TxnRef: newPaymentId,
                vnp_OrderInfo: order?.note || "thanh toán tiền",
                vnp_OrderType: req.body.orderType || "topup",
                vnp_Amount: amount_due * 100,
                vnp_ReturnUrl: VNP_RETURN_URL,
                vnp_IpAddr: ipAddr,
                vnp_CreateDate: createDate,
            };

            if (bankCode) {
                vnp_Params["vnp_BankCode"] = bankCode;
            }

            const sortedParams = sortObject(vnp_Params);
            sortedParams["vnp_SecureHash"] = generateSignature(
                sortedParams,
                VNP_HASH_SECRET
            );

            const paymentUrl =
                VNP_URL + "?" + qs.stringify(sortedParams, { encode: false });
            return res.send(paymentUrl);
        } catch (error) {
            console.error("Error creating payment URL:", error);
            return res.status(500).send("Internal Server Error");
        }
    }

    static async vnpayIpn(req, res) {
        const vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        const { VNP_HASH_SECRET } = process.env;

        const sortedParams = sortObject(vnp_Params);

        if (validateSignature(sortedParams, secureHash, VNP_HASH_SECRET)) {
            const rspCode = vnp_Params["vnp_ResponseCode"];
            if (rspCode === "00") {
                // Transaction success logic here
                return res.status(200).json({ RspCode: "00", Message: "Success" });
            }
            return res.status(200).json({ RspCode: rspCode, Message: "Failed" });
        } else {
            return res.status(200).json({ RspCode: "97", Message: "Invalid checksum" });
        }
    }

    static async vnpayReturn(req, res) {
        const vnp_Params = req.query;
        const secureHash = vnp_Params["vnp_SecureHash"];
        const paymentId = vnp_Params["vnp_TxnRef"];
        delete vnp_Params["vnp_SecureHash"];
        delete vnp_Params["vnp_SecureHashType"];

        const { VNP_HASH_SECRET } = process.env;

        const sortedParams = sortObject(vnp_Params);

        if (validateSignature(sortedParams, secureHash, VNP_HASH_SECRET)) {
            await Payment.findByIdAndUpdate(
                paymentId,
                { $set: { status: "completed" } },
                { new: true }
            );
            return res.json({
                status: "success",
                message: "Transaction successful",
                responseCode: vnp_Params["vnp_ResponseCode"],
                transactionId: vnp_Params["vnp_TxnRef"],
                amount: vnp_Params["vnp_Amount"],
                bankCode: vnp_Params["vnp_BankCode"],
                paymentDate: vnp_Params["vnp_PayDate"],
            });
        } else {
            return res.json({
                status: "error",
                message: "Transaction failed",
                responseCode: "97",
            });
        }
    }
}

module.exports = PaymentService;
