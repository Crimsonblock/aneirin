// console.log("Hello from docker");
import express from "express";
import process from "node:process";

process.on('SIGINT', stopApp);
process.on('SIGTERM', stopApp);

const app = express();
const port = 80;

app.get("/", (req, res)=>{
    res.send("Hello World !");
});


const server = app.listen(port);
console.log("Started");


function stopApp(){
    console.log("Stopping");
    server.close();
    process.exit(0);
}