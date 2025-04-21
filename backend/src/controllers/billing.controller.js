const { SuccessResponse } = require("../core/success.response")
const paymentService = require("../services/payment.service")

class billingController{
    createPayment = async(req, res, next)=>{
        new SuccessResponse({
            message:"create payment successfully",
            metadata: await paymentService.createPaymentUrl(req, res)
        })
    }
    vnpayIPN = async(req, res, next)=>{
        new SuccessResponse({
            message:"return code vnpay ipn",
            metadata: await paymentService.vnpayIpn(req, res)
        }).send(res)
    }
    vnpayReturn = async(req, res, next)=>{
        new SuccessResponse({
            message:"vnpay return",
            metadata:await paymentService.vnpayReturn(req, res)
        }).send(res)
    }
}

module.exports= new billingController()