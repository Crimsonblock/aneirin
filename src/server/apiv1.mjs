import bodyParser from "body-parser";
import { Router } from "express";
import Setup from "./setup.mjs";
import { writeFileSync } from "node:fs";
import path from "node:path";

// Here, a function is used to generate the api so we can interact with the config 
// and it is reflected in the "index.mjs"
function getApi(config, resources) {
    var router = Router();
    // Creates the setup api
    router.use("/setup", createSetupApi(config, resources));

    return router;
}

// Here, a function is used to generate this section of the api for the same reason as the above
function createSetupApi(config, resources) {
    var setup = Router();

    setup.get("/*", (req, res) => {
        res.send("coucou");
    });

    // All information is transmitted form-encoded, so the middleware is used on the whole api section
    setup.use(bodyParser.json());

    // Used to initialize the DB
    setup.post("/initDb", (req, res) => {
        // Checks if the db is already initialized. If it is, refuses the request.
        if (config.installed || config.installStage == 1) {
            res.set("Content-Type", "application/json");
            res.status(403);
            res.send("db already initialized");
        }
        else {

            try {
                var db = Setup.init({ db_type: req.body.type, db_username: req.body.db_username, db_password: req.body.db_username, db_file: req.body.file });
                if (db == null) {
                    res.status(500);
                    res.send("An error occurred while installing the database.");
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
            res.send("System already installed");
        }
        else if (config.installStage != 1) {
            res.set("Content-Type", "application/json");
            res.status(403);
            res.send("Db not initialized yet");
        }
        else {
            if (typeof (req.body.username) == "undefined") {
                res.status(400);
                res.send("username not provided");
                return;
            }
            if (typeof (req.body.password) == "undefined") {
                res.status(400);
                res.send("password not provided");
                return;
            }

            try {
                resources.db.addUser(req.body.username, req.body.password, 1);
                delete config.installStage;
                config.installed = true;
                writeFileSync(path.join(process.env.DATA_DIR, "/config.json"), JSON.stringify(config, null, "\t"));
            } catch (e) {
                res.status(500);
                res.send("Error encountered during default user creation");
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

export default getApi;
