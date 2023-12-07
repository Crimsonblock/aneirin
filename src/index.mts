import path from "path";
import { Logger, LOG_LEVEL } from "./utils/Logger.mjs";
import { IConfig, getConfig } from "./utils/utils.mjs";
import { existsSync, readFileSync, readSync } from "fs";
import express from "express";
import DbManager from "./DbManager.mjs";
import { ERR_CODES } from "./ErrCodes.js";

const CONFIG_FOLDER = "./config";

let db: DbManager;

var config: IConfig = getConfig();

Logger.logLevel = LOG_LEVEL.DEBUG;

if(typeof(config.dbInfo) != "undefined"){
    db = DbManager.getInstance(config.dbInfo);

    Logger.dLog("Connecting to the database");
    if(!await db.connect()){
        Logger.err("Could not connect to the database");
        process.exit(ERR_CODES.DB_CONNECTION_FAILED);
    }

    Logger.dLog("Setting up database models");
    await db.setupModels();
}


Logger.dLog("Configugration: ")
Logger.dLog(config);

const app = express();

app.get("/", (req, res) =>{
    if(typeof(config.dbInfo) == "undefined")
        res.send("Setup Wizard");
    else
        res.send("Application");
})


app.listen(3000, ()=>{
    Logger.log("Server started");
});


