import process from "process";
import { DBInfo } from "../DbManager.js";
import { LOG_LEVEL, Logger, dLog } from "./Logger.mjs";
import { Dialect } from "sequelize";
import { existsSync, mkdirSync, readFileSync, writeFile, writeFileSync } from "fs";
import path from "path";
import DbManager from "../DbManager.mjs";
import User from "../models/User.js";

const CONFIG_FOLDER = "./config"


interface IUserInfo {
    username: string,
    password?: string
}

export interface IConfig{
    dbInfo?: DBInfo
}

export interface ISetupWizardParameters{
    provideDbWizard: boolean,
    provideUserWizard: boolean
}

/**
 * This function extracts the information necessary to run from the environment variables, if they exist.
 * 
 * @returns DBInfo The information of the database.
 */
export function processEnvironmentVariables(): DBInfo | void {    
    if (typeof (process.env.DB_TYPE) == "undefined") return;
    
    var dbInfo = getDbEnv();
    
    if (dbInfo != null)
    return dbInfo;
    
}

/**
 * This function extracts the database information from the environment variables, if they exist.
 * 
 * @returns a DBInfo struct, containing the database connection information, contained in the environment variables. 
 * When no environment variables are present, null is returned.
 */
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
        return getDBMSInfo();
    }
    
    return dbInfo;
}

/**
 * This function retrievees the database connection informatio from the environment variables.
 * @returns dbInfo the DBMSInfo that contains the connection information
 */
function getDBMSInfo(): DBInfo | null{
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
        
        var dbInfo: DBInfo = {
            type: (process.env.DB_TYPE as Dialect),
            username: dbUser.username,
            password: dbUser.password,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME
        }
        
        if (typeof (process.env.DB_PORT) != "undefined")
        dbInfo.port = parseInt(process.env.DB_PORT);
        
        return dbInfo;
    }
}

/**
 * Extracts the database connection information from the environment variables.
 * @returns IUserInfo the database connection information if found.
 */
function getDbUserEnv(): IUserInfo | null {
    if (typeof (process.env.DB_USERNAME) == "undefined") {
        return null;
    }
    return {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD
    }
}

/**
 * Extracts the log level from the environment variables and set it up
 */
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

/**
 * Retrieves the config from the config file if it exists. Otherwise, creates a default config and saves it in the config file.
 * @returns IConfig the configuration struct
 */
export async function getConfig(): Promise<IConfig>{
    var config: IConfig = {}
    var configFileExists: boolean = true;
    
    if(!existsSync(CONFIG_FOLDER))
    mkdirSync(CONFIG_FOLDER);
    
    if(!existsSync(path.join(CONFIG_FOLDER, "config.json"))){
        configFileExists = false;
        
        var envDbInfo = processEnvironmentVariables()
        
        if(typeof(envDbInfo) != "undefined")
        config.dbInfo = envDbInfo;
    }
    else{
        config = JSON.parse(readFileSync(path.join(CONFIG_FOLDER, "config.json")).toString()) as IConfig;
    }
    

    if(!configFileExists)
    await saveConfig(config)

    return config;
}

/**
 * This function saves a configuration struct passed as argument into the configuration file.
 * @param config The configuration struct to save
 * @returns A promise that solves when the file is succesfully saved
 */
export async function saveConfig(config: IConfig): Promise<void> {
    return new Promise<void>((resolve, reject)=>{
        if(typeof(config) != "object")
            reject("saveConfig expects a parameter of type Object implementing interface IConfig");
        
        writeFile(path.join(CONFIG_FOLDER, "config.json"), JSON.stringify(config, null, 4), ()=>{
            resolve();
        });
    })
    
}


/**
 * This function sets the application up (opens the database connection, ...) given a config passed as argument.
 * It then returns an ISetupWizardParameters object that defines if the setup wizard needs to be displayed in the web browser. 
 * 
 * @param config The config struct to base the setup on
 * @returns ISetupWizardParameters an object containing the setup wizards to be displayed.
 */
export async function configApp(config: IConfig): Promise<ISetupWizardParameters>{    
    Logger.dLog("Configuring application...")
    processLogLevelEnv();

    var setupWizardParams: ISetupWizardParameters = {
        provideDbWizard: true,
        provideUserWizard: true
    }

    if(typeof(config.dbInfo) != "undefined"){
        var dbMan: DbManager = DbManager.getInstance(config.dbInfo);

        if(await dbMan.connect()){
            Logger.dLog("connected to db");
            setupWizardParams.provideDbWizard = false;

            await dbMan.setupModels();
            Logger.dLog("Db initialized");
    
            var t = await User.findOne({where: {isAdmin: true}});
            setupWizardParams.provideUserWizard = t == null;
        }
    }

    Logger.dLog("Application successfully configured");
    return setupWizardParams;
}