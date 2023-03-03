import { read, readFileSync } from "node:fs";
import process from "node:process";
import SqliteManager from "./dbManagers/sqliteManager.mjs";

// Reads the config from the config file.
export function readConfig(){
    try{
        return JSON.parse(readFileSync("/data/config.json"));
    }
    catch(e){
        return {};
    }
}


export function init(config){
    if(config.installed){
        console.log("application already installed");
    }
    else{
        console.log("Application not installed yet")
        if(process.env.DB_TYPE == "sqlite"){
            console.log("sqlite environment variable set");
            config.db_type="sqlite";
            if(typeof(process.env.DB_FILE)!="undefined") config.db_file=process.env.DB_FILE;
            if(typeof(config.db_file) != "undefined"){
                var db = new SqliteManager();
                db.connect({file: config.db_file});
                db.install();
            }
        }

    }
}

export default {
    "readConfig": readConfig,
    "init": init 
};