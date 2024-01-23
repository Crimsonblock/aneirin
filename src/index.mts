import path from "path";
import process from "process";
import { Logger, LOG_LEVEL } from "./utils/Logger.mjs";
import { IConfig, configApp, getConfig } from "./utils/utils.mjs";
import { existsSync, readFileSync, readSync } from "fs";
import express from "express";
import DbManager from "./DbManager.mjs";
import { ERR_CODES } from "./AppErrCodes.js";
import { DBInfo } from "./DbManager.js";
import User from "./models/User.js";
import Cithar from "./api/Cithar.js";
import { removeHeaders } from "./utils/MiddleWares.js";

export const CONFIG_FOLDER = "./config";

Logger.logLevel = LOG_LEVEL.DEBUG;
Logger.dLog("Getting config");
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

const citharApi = new Cithar(configWizard.provideDbWizard, configWizard.provideUserWizard);
const app = express();
app.use(removeHeaders(["X-Powered-By"]));

app.use("/api/cithar", citharApi.getApi());

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

    res.send(response+"\n");
})


app.listen(3000, ()=>{
    Logger.log("Server started");
});