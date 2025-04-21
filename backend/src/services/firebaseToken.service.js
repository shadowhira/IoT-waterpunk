const FirebaseToken = require("../models/firebaseToken.model")

class firebaseTokenService{
    static findToken = async(token)=>{
        return await FirebaseToken.findOne({registrationToken:token}).lean();
    }
    static upsertFirebaseToken = async( {deviceType, firebaseToken})=>{
        const filter = {deviceInfo: deviceType}
        const update = {
            registrationToken:firebaseToken
        }
        const options = {
            upsert:true,
            new:true
        }
        const token = await FirebaseToken.findOneAndUpdate(filter, update, options);
        return token ? token : null
    }
}
module.exports = firebaseTokenService