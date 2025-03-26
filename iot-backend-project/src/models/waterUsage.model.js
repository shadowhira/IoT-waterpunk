const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "WaterUsage";
const COLLECTION_NAME = "WaterUsage";

const waterUsageSchema = new mongoose.Schema({
    device_id: {
        type: Schema.Types.ObjectId,
        required: true,
        index: true,
        ref:"Device"
    },
    volume: {
        type: Number,
        required: true
    }
}, {
    timestamps: { createdAt: true, updatedAt: false },  // Chỉ cần tạo createdAt, không cần updatedAt
    collection: COLLECTION_NAME
});

const WaterUsage = mongoose.model(DOCUMENT_NAME, waterUsageSchema);
module.exports = WaterUsage;
