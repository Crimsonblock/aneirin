import { read, readFileSync, writeFileSync, writeSync } from "node:fs";
import process from "node:process";
import SqliteManager from "./dbManagers/SqliteManager.mjs";
import { createHash } from "node:crypto";
import path from "node:path";

import { Log } from "./utils.mjs";

export default {
    "readConfig": readConfig,
    "init": init
};

const VERSION = "0.1.0";

/**
 * DB support addition only takes place here, provided that the 
 * abstraction layer was correctly implemented.
 * 
 * To make support addition easier, you can search for the comment
 * "To add db support: " and follow the provided instruction.
*/


export function readConfig() {
    try {
        return JSON.parse(readFileSync(path.join(process.env.DATA_DIR, "/config.json")));
    }
    catch (e) {
        return {};
    }
}


// Initializes the database system.
export function init(config) {
    if (config.installed || config.installStage == 1) {
        Log.setConfig(config);

        /**
         * To add db support: 
         *      add a new case to the switch structure, to create the DB manager 
         *      for the new DBMS. The information should be retrieved from the config file.
         */


        switch (config.db_type) {
            case "sqlite":
                var db = new SqliteManager();
                db.connect({ file: config.db_file });
                return db;
        }
    }

    

    else {
        config.data_in = typeof (process.env.DATA_IN) == "undefined" ? "/in" : process.env.DATA_IN;
        config.data_out = typeof (process.env.DATA_OUT) == "undefined" ? "/out" : process.env.DATA_OUT;
        config.data_shared = typeof (process.env.DATA_SHARED) == "undefined" ? "/shared" : process.env.DATA_SHARED;
        config.data_dir = typeof(process.env.DATA_DIR == "undefined") ? "/data" : process.env.DATA_DIR;

        config.log_level = typeof (process.env.LOG_LEVEL) == "undefined" ?  5 : process.env.LOG_LEVEL;
        config.codecs = ["-c:a:0 flac", "-c:a:1 aac -b:a 128k"];

        Log.setConfig(config);

        var db = -1;


        /**
         * To add db support:
         *      Add a switch case for the new DB type (checked in the DB_TYPE environment variable here).
         *      In this case part, you should check for as many information as possibe in the environment variable
         *          (e.g. if the db username and passwords were provided, if the default user's username and password
         *          were provided in the env vairables) and setup your DB accordingly. 
         *          
         *          If no default username and password were provided, the config.installStage should additionally be set to 1.
         *          Additionally, the config object should be updated with the correct db type as well as db username and password.
         *          Don't forget to write the config file with the following line: 
         *              writeFileSync(path.join(process.env.DATA_DIR, "/config.json"), JSON.stringify(config));
         * 
         *          You need to set the "db" variable to the database manager object. It is advised to make a helper function as it will be called from
         *          several places
         */

        switch (process.env.DB_TYPE) {
            case "sqlite":
                if (typeof (process.env.DB_FILE) != "undefined") {
                    if (typeof (process.env.USERNAME) != "undefined" && typeof (process.env.PASSWORD) != "undefined") {
                        db = initSqliteDb(process.env.DB_FILE, process.env.USERNAME, process.env.PASSWORD);
                        config.installed = true;
                    }
                    else {
                        db = initSqliteDb(process.env.DB_FILE);
                        config.installStage = 1;
                    }
                    config.db_type = process.env.DB_TYPE;
                    config.db_file = process.env.DB_FILE;
                    config.version = VERSION;
                    writeFileSync(path.join(process.env.DATA_DIR, "/config.json"), JSON.stringify(config, null, 2));
                }
                else db = null;
                break;
        }

        // Checks for the DB configuration in the config variable. 
        // This is used when the setup is done through the web interface.
        /**
        * To add db support:
        *      This function only gets called when the application is set up with the web wizard.
        *      Therefore, the checks for the default username and password shouldn't be checked and
        *      the config shouldn't be altered, as it will be done by the api.
        * 
        *      You need to add a case to the switch structure for the new DB type.
        * 
        *      You can access the db information fields with the same name as the environment variables in lower case in the config variable.
        *      (e.g. config.db_type, config.db_username, config.db_password, ...)
        * 
        *      In this case, you should only check for db_username, db_password or db_file.
        * 
        *      You need to set the "db" variable to the database manager object. It is advised to make a helper function as it will be called from
        *      several places
        */
        switch (config.db_type) {
            case "sqlite":
                if (typeof (config.db_file) != "undefined") {
                    db = initSqliteDb(config.db_file);
                }
                else db = null;
        }
        return db;
    }

    return null;
}


function initSqliteDb(file = null, username = null, password = null) {
    if (file == null) return null;

    // Creates, connect to and install the db
    var db = new SqliteManager();
    db.connect({ file: file });
    db.install();

    // If username and password are present, initializes the first user
    if (username != null && password != null) {
        db.addUser(username, createHash("bcrypt").update(password).digest("hex"), 1);
    }

    return db;
}

/** 
 * To add db support:
 *      Add the new helper functions to create the DB manager here below.
 *      It is not necessary but it is however strongly advised.
 */