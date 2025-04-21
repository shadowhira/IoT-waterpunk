const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "Payment";
const COLLECTION_NAME = "Payments";

const billingPeriodSchema = new mongoose.Schema({
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    }
});

const paymentSchema = new mongoose.Schema({
    billing_period: {
        type: billingPeriodSchema,
        required: true
    },
    amount_due: {
        type: Number,  
        required: true
    },
    payment_status: {
        type: String,
        enum: ['pending', 'completed'],
        default: 'pending'
    }
}, {
    timestamps: true, 
    collection: COLLECTION_NAME
});

paymentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 }); // 900 seconds = 15 minutes

const Payment = mongoose.model(DOCUMENT_NAME, paymentSchema);
module.exports = Payment;
