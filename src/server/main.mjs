import process from "node:process";
import express from "express";
import Setup from "./setup.mjs";
import bodyParser from "body-parser";
import cors from "cors";
import path from "node:path";
import { fork } from "node:child_process";

const VERSION = "0.1.0";

import apiv1 from "./apiv1.mjs";
import log, {LOG_LEVEL} from "./utils.mjs";

process.env.DATA_DIR = typeof(process.env.DATA_DIR) == "undefined" ? "/data" : process.env.DATA_DIR;
const config = Setup.readConfig();
const __dirname = path.resolve();



/*
Existing environment variables:
-------The following environment variables are checked only for the installation of Aneirin. If one wants, it is possible to omit it when a config file already exists.

DB_TYPE -> The system to be used. Valid possibilities are: "sqlite"
DB_HOST -> The ip address of the db host
DB_USERNAME -> The username of the remote database
DB_PASSWORD -> The password of the remote database
DB_NAME -> The name of the database to connect to
DB_FILE -> The file containing the database. Used when a local database is selected instead of a remote (e.g. sqlite)
USERNAME -> The username to be set up for Aneirin.
PASSWORD -> The password to be set up for Aneirin.

DATA_DIR -> The data directory, where the db and the segmented files get stored.
DATA_IN -> The input directory. All music in this directory is checked for the tags then transcoded and encapsulated in mp4, ready for streaming.
DATA_OUT -> The output directory. All music that was requested to be ejected will be found in this directory.
DATA_SHARED -> The shared directory. All music that was asked to be shared to be used with other system will be found here. Beware, music is not truly shared,
there are rather two copies: the one in DATA_SHARED directory, ready for players and the streaming-ready one in the DATA_DIR directory.

---------The following environment variables are checked every time the procram is started, so it's better to set them all the time.
DATA_DIR -> The data directory. It will hold the config files, the database (if applicable) and the music files.
PORT -> The port the server must listen to
EXPERIMENTAL -> USED FOR DEVELOPMENT ONLY! Allows to run raw db queries (which is unsafe!). Should never be set to true in a production environment.
*/

process.env.DB_TYPE = "sqlite";
process.env.DB_FILE = "/data/aneirin.db";
process.env.USERNAME = "username";
process.env.PASSWORD = "password";

process.env.EXPERIMENTAL = true;


const resources = {};
resources.libraryManager = fork("libraryManager.mjs");
resources.libraryManager.send({type:"setup", config: config});
resources.db = Setup.init(config);


resources.libraryManager.on("message", msg=>{
    switch(msg.type){
        case "updateTranscoding":
            config.transcoding = msg.val;
    }
});


log( LOG_LEVEL.WARN, "[index.mjs - 45] TEST ENVIRONMENT VARIABLES SET. REMEMBER TO REMOVE BEFORE DEPLOYMENT");


// Initiates the app and checks if the port was set through the environment variable
const app = express();
const port = typeof(process.env.PORT) == "undefined" ? 80 : process.env.PORT;

if(typeof(process.env.DEV)!="undefined")
    app.use(cors());

// Creates the api
const api = new apiv1(config, resources);

app.use("/api/v1", api.getApi());

// Creates the server's endpoints
app.get("/stop", (req, res)=>{
    res.send("Stopping server...");
    stopApp();
})
.get("/setup/*", (req, res)=>{
    if(config.installed) res.redirect("/");
    if(config.installStage!=1) res.redirect("/setup");
    res.sendFile(path.join(__dirname, "/setup.html"));
})
.get("/setup", (req, res) =>{
    if(config.installed) res.redirect("/");
    if(config.installStage == 1) res.redirect("/setup/account");
    res.sendFile(path.join(__dirname, "/setup.html"));
})
.get("/admin", (req, res)=>{
    if(!config.installed) res.redirect("/setup");
    if(config.installStage == 1) res.redirect("/setup/account");
    res.send("coucou");
    // res.send(__dirname);
})
.get("/*", (req, res)=>{
    if(config.installed) res.send("Application already installed");
    else if(config.installStage == 1) res.redirect("/setup/account");
    else res.redirect("/setup");
})
.post("/test", bodyParser.raw(), (req, res)=>{
    console.log(req.body.readUInt8());
    // console.log(req.body.toString());
    res.send("Ok");
})
;


process.on('SIGTERM', stopApp);
process.on("SIGINT", stopApp);

function stopApp() {
    log(LOG_LEVEL.INFO, "Stopping application");
    server.close();
    api.closeOpenFiles();
    resources.libraryManager.send({type:"stop"});
    process.exit(0);
}

var server = app.listen(port, ()=>{
    log(LOG_LEVEL.INFO, "Application started");
});