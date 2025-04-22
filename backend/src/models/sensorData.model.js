const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "SensorData";
const COLLECTION_NAME = "SensorData";

const sensorDataSchema = new mongoose.Schema(
  {
    temperature: {
      type: Number,
      default: 0
    },
    tds: {
      type: Number,
      default: 0
    },
    flowRate: {
      type: Number,
      default: 0
    },
    pumpState: {
      type: Number,
      default: 0
    },
    distance: {
      type: Number,
      default: 0
    },
    currentLevelPercent: {
      type: Number,
      default: 0
    },
    leakDetected: {
      type: Number,
      default: 0
    },
    leakType: {
      type: Number,
      default: 0
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    collection: COLLECTION_NAME,
  }
);

const SensorData = mongoose.model(DOCUMENT_NAME, sensorDataSchema);
module.exports = SensorData;
