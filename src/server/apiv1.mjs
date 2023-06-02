import bodyParser from "body-parser";
import { Router } from "express";
import Setup from "./setup.mjs";
import { writeFileSync, mkdirSync, openSync, closeSync, writeSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";



const LOG_LEVEL = {
    ERROR: 1,
    WARN: 2,
    INFO: 3,
    DEBUG: 4
}

// A function to handle the errors of the json bodyParser
function handleJsonError(err, req, res, next) {
    if (err instanceof SyntaxError) {
        res.status(400);
        res.send("Invalid JSON");
    }
    else
        next();
}



class Apiv1 {

    files = {};

    constructor(config = null, resources = null) {
        if (config == null)
            throw new Error("Settings not provided to the api");
        if (resources == null)
            throw new Error("Resources not providded to the api");

        this.config = config;
        this.resources = resources;
    }

    
    getApi() {
        var router = Router();


        // Creates the setup api
        router.use("/setup", this.createSetupApi(this.config, this.resources));
        router.use("/files", this.createFilesApi(this.config));

        // Prevents the non existing api endpoints to return a non-api response
        router.use("/*", (req, res)=>{
            res.status(404);
            res.send("Not found");
        });

        return router;
    }

    createFilesApi(config) {
        var filesController = Router();

        // Setup the path in which to store the files to be processed later on
        const TO_BE_PROCESSED = path.join(config.data_dir, "/toBeProcessed");

        // The endpoint to create the incoming file
        filesController.post("/create/:size", (req, res) => {
            // Creates the file where the unprocessed files will be stored
            mkdirSync(TO_BE_PROCESSED, { recursive: true });

            // Creates a new file UUID, to prevent closing random files with random numbers
            var fileId = randomUUID();

            // Opens a file and pre-allocates the size 
            var fd = openSync(path.join(TO_BE_PROCESSED, fileId), "w");
            writeSync(fd, "ok", Math.max(0, req.params.size - 2));

            // Stores the file descriptor in the holder
            this.files[fileId] = fd;
            res.send(fileId);
        })


        // This endpoints adds data to the created file
        filesController.post("/add/:fileId/:offset", bodyParser.raw({inflate:true, limit: "1mB"}), (req, res) => {
            this.log(LOG_LEVEL.DEBUG, "writing file");
            
            // Checks if the file exists
            if (this.files[req.params.fileId] == null) {
                res.status(404);
                res.send("File not found");
                this.log(LOG_LEVEL.WARN, "Could not find file with id " + req.params.fileId);
            }
            
            // Writes the file and sends the response 
            writeFileSync(this.files[req.params.fileId], req.body, {offset: req.params.offset});
            this.log(LOG_LEVEL.DEBUG, "file written");
            res.send("ok");
        });


        // Closes thie file
        filesController.post("/close/:fileId", (req, res) => {

            // Handles closing events crashes
            try {

                // Checks if the file exists
                if (typeof (this.files[req.params.fileId]) == "undefined") {
                    res.status(400);
                    res.send("File not found");
                    return;
                }

                // Closes the file and removes it from the files registry
                closeSync(this.files[req.params.fileId]);
                delete this.files[req.params.fileId];
                res.send("ok");

            } catch (e) {
                res.status(500);
                res.send("Internal server error");
                this.log(LOG_LEVEL.ERROR, "Error while closing an opened file");
                this.log(LOG_LEVEL.ERROR, e);
            }
        });

        filesController.post("/startScanning", (req, res) =>{
            res.send("Ok");
        });


        return filesController;
    }

    createSetupApi(config, resources) {
        var setup = Router();

        setup.get("/*", (req, res) => {
            res.send("coucou");
        });

        // All information is transmitted form-encoded, so the middleware is used on the whole api section
        setup.use(bodyParser.json());
        setup.use(handleJsonError);

        // Used to initialize the DB
        setup.post("/initDb", (req, res) => {
            // Checks if the db is already initialized. If it is, refuses the request.
            if (config.installed || config.installStage == 1) {
                res.set("Content-Type", "application/json");
                res.status(403);
                res.send("Forbidden");
                console.log("User tried to install a new DB on a system that is already installed");
            }
            else {

                try {
                    // Initializes the database
                    var db = Setup.init({ db_type: req.body.type, db_username: req.body.db_username, db_password: req.body.db_username, db_file: req.body.file });
                    if (db == null) {
                        res.status(500);
                        res.send("Internal server error");
                        return;
                    }
                    else if (db == -1) {
                        res.status(500);
                        res.send("An error occurred while installing the database.");
                        console.log("The database " + req.body.type + " is not supported");
                        return;
                    }
                    else {
                        // Update the installStage and write the config file to the disk
                        config.installStage = 1;
                        config.db_type = req.body.type;
                        config.db_file = req.body.file;
                        writeFileSync(path.join(process.env.DATA_DIR, "/config.json"), JSON.stringify(config, null, "\t"));
                        resources.db = db;
                    }
                }
                catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    console.log(e);
                }

                res.status(200);
                res.send("OK");
            }
        });

        // To setup the first user in the database
        setup.post("/initUser", (req, res) => {
            // Checks if the default admin was created and if it is, refuses the request
            if (config.installed) {
                res.set("Content-Type", "application/json");
                res.status(403);
                res.send("Forbidden");
                console.log("User tried to initialize a user to a system that is already fully installed");
            }
            else if (config.installStage != 1) {
                res.set("Content-Type", "application/json");
                res.status(403);
                res.send("Forbidden");
                console.log("User tried to initialize a user with an unitialized database. Initialize the db first.");
            }
            else {
                if (typeof (req.body.username) == "undefined") {
                    res.status(400);
                    res.send("Bad Request: username not provided");
                    return;
                }
                if (typeof (req.body.password) == "undefined") {
                    res.status(400);
                    res.send("Bad Request: password not provided");
                    return;
                }

                try {
                    resources.db.addUser(req.body.username, req.body.password, 1);
                    delete config.installStage;
                    config.installed = true;
                    writeFileSync(path.join(process.env.DATA_DIR, "/config.json"), JSON.stringify(config, null, "\t"));
                } catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    console.log("Error encountered during default user creation");
                    console.log(e);
                    return;
                }

                res.status(200);
                res.send("OK");
            }
        });

        return setup;
    }


    log(logLevel = -1, msg) {
        if (logLevel < this.config.log_level)
            return;
        switch (logLevel) {
            case LOG_LEVEL.ERROR:
                console.log("\x1b[31m<Error> ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.WARN:
                console.log("\x1b[33m<Warning> ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.INFO:
                console.log("\x1b[32m<Info> ", msg, "\x1b[0m")
                break;
            case LOG_LEVEL.DEBUG:
                console.log("\x1b[37m<Debug> ", msg, "\x1b[0m")
                break;
        }
    }

    closeOpenFiles() {
        Object.keys(this.files).forEach(key => {
            try {
                closeSync(this.files[key]);
            }
            catch (e) {
                console.log(e);
            }
        });
    }
}



export default Apiv1;
