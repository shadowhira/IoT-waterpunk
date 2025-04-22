const {app, server} = require("./src/app")
const  PORT = process.env.PORT || 4000
const HOST = process.env.HOST || '0.0.0.0'
const Server = server.listen(PORT, HOST, ()=>{
    console.log(`server is listening on ${HOST}:${PORT}`);
})
process.on("SIGINT", ()=>{
    Server.close(()=>console.log("exit server"))
    process.exit(0);
})