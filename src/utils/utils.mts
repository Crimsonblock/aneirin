import process from "process";
import { DBInfo } from "../DbManager.js";
import { LOG_LEVEL, Logger } from "./Logger.mjs";
import { Dialect } from "sequelize";
import { existsSync, mkdirSync, readFileSync } from "fs";
import path from "path";


const CONFIG_FOLDER = "./config"


interface IDBUserInfo {
    username: string,
    password?: string
}

interface IConfig{
    dbInfo?: DBInfo
}

export function processEnvironmentVariables(): DBInfo | void {
    processLogLevelEnv();

    if (typeof (process.env.DB_TYPE) == "undefined") return;

    var dbInfo = getDbEnv();

    if (dbInfo != null)
        return dbInfo;
    
}


function getDbEnv(): DBInfo | null {
    var dbInfo: DBInfo = { uri: "This will throw an error" };

    if (typeof (process.env.DB_TYPE) == "undefined") {
        Logger.dLog("Database not setup in environment, will be done in web wizard");
        return null;
    }

    // SQLite memory db
    else if (process.env.DB_TYPE == "memory") {
        Logger.warn("Database in memory does not persist. Should be used for testing purpose only.");
        dbInfo = { uri: "sqlite::memory:" }
    }

    // SQLite file db
    else if (process.env.DB_TYPE == "sqlite") {
        if (typeof (process.env.DB_FILE) == "undefined") {
            Logger.log("SQLite db type asked but file not provided, will be setup in web wizard");
            return null;
        }
        else {
            dbInfo = { path: process.env.DB_FILE }
        }
    }

    // DBMS
    else {
        if (typeof (process.env.DB_HOST) == "undefined") {
            Logger.dLog("Database Host not provided, will be setup in web wizard");
            return null;
        }

        if (typeof (process.env.DB_TYPE) == "undefined") {
            Logger.dLog("Database type not provided, will be setup in the web wizard");
            return null;
        }

        if (typeof (process.env.DB_NAME) == "undefined") {
            Logger.dLog("Database type not provided, will be setup in the web wizard");
            return null;
        }

        var dbUser = getDbUserEnv();

        if (dbUser == null) {
            Logger.dLog("Database user not provided, will be setup in the web wizard");
            return null;
        }

        else {
            if (typeof (dbUser.password) == "undefined") {
                Logger.dLog("Database password not provided, will be setup in the web wizard");
                return null;
            }

            dbInfo = {
                type: (process.env.DB_TYPE as Dialect),
                username: dbUser.username,
                password: dbUser.password,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME
            }

            if (typeof (process.env.DB_PORT) != "undefined")
                dbInfo.port = parseInt(process.env.DB_PORT);
        }

    }

    return dbInfo;
}

function getDbUserEnv(): IDBUserInfo | null {
    if (typeof (process.env.DB_USERNAME) == "undefined") {
        return null;
    }
    return {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
    }
}

function processLogLevelEnv(): void {
    switch (process.env.LOG_LEVEL) {
        case "NONE": 
            Logger.logLevel = LOG_LEVEL.NONE;
            break;
        case "ERROR":
            Logger.logLevel = LOG_LEVEL.ERROR;
            break;
        case "WARN":
            Logger.logLevel = LOG_LEVEL.WARN;
            break;
        case "INFO":
            Logger.logLevel = LOG_LEVEL.INFO;
            break;
        case "DEBUG":
            Logger.logLevel = LOG_LEVEL.DEBUG;
            break;
        default:
            Logger.logLevel = LOG_LEVEL.INFO;
            break;
    }
}

export function getConfig(): IConfig{
    var config: IConfig = {}

    if(!existsSync(CONFIG_FOLDER))
        mkdirSync(CONFIG_FOLDER);
    
    if(!existsSync(path.join(CONFIG_FOLDER, "config.json"))){
        var envDbInfo = processEnvironmentVariables()
        if(typeof(envDbInfo) != "undefined")
            config.dbInfo = envDbInfo;
    }
    else{
        config = JSON.parse(readFileSync(path.join(CONFIG_FOLDER, "config.json")).toString());
    }

    return config;
}


export async function saveConfig(config: IConfig): Promise<void> {
    
}