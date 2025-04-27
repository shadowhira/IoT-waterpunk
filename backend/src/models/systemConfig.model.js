const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "SystemConfig";
const COLLECTION_NAME = "SystemConfigs";

const systemConfigSchema = new mongoose.Schema({
    tank_height: {
        type: Number,
        default: 15.0,
        required: true
    },
    max_temp: {
        type: Number,
        default: 35.0,
        required: true
    },
    max_tds: {
        type: Number,
        default: 500.0,
        required: true
    },
    leak_threshold: {
        type: Number,
        default: 0.5,
        required: true
    },
    flow_threshold: {
        type: Number,
        default: 0.2,
        required: true
    },
    device_id: {
        type: String,
        default: "default",
        required: true
    },
    alerts_enabled: {
        type: Boolean,
        default: true,
        required: true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

// Đảm bảo chỉ có một cấu hình cho mỗi thiết bị
systemConfigSchema.index({ device_id: 1 }, { unique: true });

const SystemConfig = mongoose.model(DOCUMENT_NAME, systemConfigSchema);
module.exports = SystemConfig;
