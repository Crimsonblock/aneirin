import bodyParser from "body-parser";
import { Router } from "express";
import Setup from "./setup.mjs";
import { writeFileSync, mkdirSync, openSync, closeSync, writeSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

// Here, a function is used to generate the api so we can interact with the config 
// and it is reflected in the "index.mjs"
function getApi(config, resources) {
    var router = Router();
    // Creates the setup api
    router.use("/setup", createSetupApi(config, resources));
    router.use("/files", createFilesApi());

    return router;
}

function handleJsonError(err, req, res, next) {
    if (err instanceof SyntaxError) {
        res.status(400);
        res.send("Invalid JSON");
    }
    else
        next();
}

// Here, a function is used to generate this section of the api for the same reason as the above
function createSetupApi(config, resources) {
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
                var db = Setup.init({ db_type: req.body.type, db_username: req.body.db_username, db_password: req.body.db_username, db_file: req.body.file });
                if (db == null) {
                    res.status(500);
                    res.send("Internal server error");
                    return;
                }
                else if(db==-1){
                    res.status(500);
                    res.send("An error occurred while installing the database.");
                    console.log("The database "+req.body.type+" is not supported");
                    return;
                }
                else {
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
    })
        ;

    return setup;
}


function createFilesApi() {
    var filesController = Router();

    const files = {};
    const TO_BE_PROCESSED = path.join(process.env.DATA_DIR, "/toBeProcessed");

    filesController.post("/create/:size", (req, res) => {
        mkdirSync(TO_BE_PROCESSED, { recursive: true });
        var fileId = randomUUID();
        var fd = openSync(path.join(TO_BE_PROCESSED, fileId), "w");
        writeSync(fd, "ok", Math.max(0, req.params.size - 2));
        files[fileId] = fd;
        res.send(fileId);
    })

    filesController.post("/close/:fileId", (req, res)=>{
        try{
            if(typeof(files[req.params.fileId]) == "undefined"){
                res.status(400);
                res.send("File not found");
                return;
            }
            closeSync(files[req.params.fileId]);
            delete files[req.params.fileId];
            res.send("ok");

        }catch(e){
            res.status(500);
            res.send("Internal server error");
            console.log("Error while closing an opened file");
            console.log(e);
        }
    });


    return filesController;
}

export default getApi;
