const mongoose = require("mongoose")
const {db:{mongoUrl}} = require("../config/config.database")
const connectString = mongoUrl

class Database{
    constructor(){
        this.connect();
    }

    connect(type = "mongodb"){
        // Tắt debug log của Mongoose để tránh hiển thị quá nhiều thông tin
        mongoose.set("debug", false);
        // Chỉ bật debug khi cần
        // mongoose.set("debug", {color:true})

        mongoose
            .connect(connectString, {maxPoolSize:50})
            .then((_)=>{
                console.log("Connected database successfully")
            })
            .catch((err)=>{
                console.log(connectString)
                console.log("Error:Fail Database Connection:", err);
            })
    }

    static getInstance(){
        if(!Database.instance){
            Database.instance = new Database()
        }
        return Database.instance
    }
}

const instanceDatabase = Database.getInstance()
module.exports = instanceDatabase