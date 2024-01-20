import path from "path";
import process from "process";
import { Logger, LOG_LEVEL } from "./utils/Logger.mjs";
import { IConfig, configApp, getConfig } from "./utils/utils.mjs";
import { existsSync, readFileSync, readSync } from "fs";
import express from "express";
import DbManager from "./DbManager.mjs";
import { ERR_CODES } from "./ErrCodes.js";
import { DBInfo } from "./DbManager.js";
import User from "./models/User.js";

const CONFIG_FOLDER = "./config";


var config: IConfig = await getConfig();

var configWizard = await configApp(config);
Logger.dLog(configWizard);

/*if(configWizard.provideUserWizard && ! configWizard.provideDbWizard){
    Logger.dLog("Creating default user");
    User.create({
        username: "test",
        password: "test",
        salt: "test",
        isAdmin: true
    })
}*/

const app = express();

app.get("/", (req, res) =>{
    var response = "";
    if(!configWizard.provideDbWizard && ! configWizard.provideUserWizard)
        response = "Application"
    else{
        if(configWizard.provideDbWizard)
            response += "Db Wizard"
        if(configWizard.provideUserWizard)
            response += " User Wizard";
    }

    res.send(response);
})


app.listen(3000, ()=>{
    Logger.log("Server started");
});