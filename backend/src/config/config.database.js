const dev = {
    app:{
        port:3000
    },
    db:{
        mongoUrl:process.env.MONGODB_URL
    }
}
const pro = {
    app:{
        port:3000
    },
    db:{
        mongoUrl:process.env.MONGODB_URL
    }
}

const config = {dev, pro};
const env = process.env.NODE_ENV||'dev';
module.exports = config[env]