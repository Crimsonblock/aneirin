// console.log("Hello from docker");
import express from "express";
import process from "node:process";
import { api } from "./api.mjs";

import { readFileSync } from "node:fs";
var config = JSON.parse(readFileSync("config.json"))


init();


const app = express();
const port = 80;


/**
 * "/" should either: return the application itself, or 
 * the setup pages if the application is not yet setup
 */
app.get("/*", (req, res) => {
    res.send("Hello world !");
});



const server = app.listen(port);
console.log("Started");


/**
 * This function initializes the application. From the config file, it checks if the app was installed, and if not,
 * it should start the installation process. 
 * 
 * The config file should store:
 *  -If the app was installed
 *  -The type of db the app uses
 *  -The username and password of the db (if applicable)
 *  -default eject codec
 *  -If defaults to keep a clear copy of the files or not
 *  
 */
function init() {
    console.log("Initializing application");
    if (config.installed) {

    }
    else {
        console.log("Application not installed");
        // process.exit(0);
    }
}



// Node handlers for signals
process.on('SIGTERM', stopApp);
process.on("SIGINT", stopApp);

function stopApp() {
    console.log("Stopping");
    server.close();
    process.exit(0);
}