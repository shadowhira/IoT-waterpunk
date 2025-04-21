const {app, server} = require("./src/app")
const  PORT = process.env.PORT || 4000
const Server = server.listen(PORT, ()=>{
    console.log(`server is listening on port ${PORT}`);
})
process.on("SIGINT", ()=>{
    Server.close(()=>console.log("exit server"))
    process.exit(0);
})