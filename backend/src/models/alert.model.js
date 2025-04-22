const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "Alert";
const COLLECTION_NAME = "Alerts";

const alertSchema = new mongoose.Schema({
    device: {
        type: String,
        require: true
    },
    alert_type: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    },
    leak_type: {
        type: Number,
        default: 0
        // 0: Không rò rỉ, 1: Rò rỉ mực nước, 2: Rò rỉ lưu lượng, 3: Bơm quá lâu
    },
    value: {
        type: Number,
        default: 0
    },
    is_active: {
        type: Boolean,
        default: true
    },
    resolved_at: {
        type: Date,
        default: null
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

const Alert = mongoose.model(DOCUMENT_NAME, alertSchema);
module.exports = Alert;
