const { mongoose, model, Schema, Types } = require("mongoose");
const DOCUMENT_NAME = "FirebaseToken";
const COLLECTION_NAME = "FirebaseTokens";

const FirebaseTokenSchema = new mongoose.Schema({
    registrationToken:{
        type:String,
        require:true
    },
    deviceInfo:{
        type:String, // Android, Ios, Web
        require:true
    }
}, {
    timestamps: true,
    collection: COLLECTION_NAME,
});
const FirebaseToken = mongoose.model(DOCUMENT_NAME, FirebaseTokenSchema);
module.exports = FirebaseToken;
