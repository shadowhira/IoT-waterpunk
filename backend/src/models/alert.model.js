const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "Alert";
const COLLECTION_NAME = "Alerts";

const alertSchema = new mongoose.Schema({
    device: {
        type:String,
        require:true
    },
    alert_type: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true
    },
}, {
    timestamps: true,
    collection: COLLECTION_NAME
});

const Alert = mongoose.model(DOCUMENT_NAME, alertSchema);
module.exports = Alert;
