import bodyParser from "body-parser";
import { Router } from "express";
import Setup from "./setup.mjs";
import { writeFileSync, mkdirSync, openSync, closeSync, writeSync, readFileSync, readSync, createReadStream, statSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createGzip, createDeflate } from "node:zlib";

import log, { LOG_LEVEL } from "./utils.mjs";

const CHUNK_INDEX_LENGTH = 5;


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

        // router.use((req, res, next) => {
        //     log(LOG_LEVEL.DEBUG, "Getting " + req.method + " request on " + req.baseUrl + req.url.toString());
        //     next();
        // });

        // Creates the setup api
        router.use("/setup", this.createSetupApi(this.config, this.resources));
        router.use("/files", this.createFilesApi(this.config));
        router.use("/lib", this.createLibraryApi(this.config));

        // Prevents the non existing api endpoints to return a non-api response
        router.use("/*", (req, res) => {
            res.status(404);
            res.send("Not found");
            log(LOG_LEVEL.DEBUG, "Api endpoint not found " + req.baseUrl);
        });

        return router;
    }

    createFilesApi(config) {
        var filesController = Router();

        // Setup the path in which to store the files to be processed later on
        const TO_BE_PROCESSED = path.join(config.data_dir, "/toBeProcessed");

        // The endpoint to create the incoming file
        filesController.post("/create/:size", (req, res) => {
            mkdirSync(TO_BE_PROCESSED, { recursive: true });

            var fileId = randomUUID();

            var fd = openSync(path.join(TO_BE_PROCESSED, fileId), "w");
            writeSync(fd, "ok", Math.max(0, req.params.size - 2));


            this.files[fileId] = fd;
            res.send(fileId);
            log(LOG_LEVEL.DEBUG, "Created file with id " + fileId);
        });


        // This endpoints adds data to the created file
        filesController.post("/add/:fileId/:offset", bodyParser.raw({ inflate: true, limit: "1mB" }), (req, res) => {

            // Checks if the file exists
            if (this.files[req.params.fileId] == null) {
                res.status(404);
                res.send("File not found");
                log(LOG_LEVEL.WARN, "Could not find file with id " + req.params.fileId);
            }

            // Writes the file and sends the response 
            writeFileSync(this.files[req.params.fileId], req.body, { offset: req.params.offset });
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
                log(LOG_LEVEL.ERROR, "Error while closing an opened file");
                log(LOG_LEVEL.ERROR, e);
            }

            log(LOG_LEVEL.DEBUG, "Closed file with id " + req.params.fileId);
        });

        filesController.post("/startScanning", (req, res) => {
            res.send("Ok");
        });

        filesController.get("/isTranscoding", (req, res) => {
            res.send(typeof (this.config.transcoding) == "undefined" ? false : this.config.transcoding);
        });

        filesController.post("/startTranscoding", (req, res) => {
            res.send("ok");
            this.resources.libraryManager.processDataDirectory();
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
                log(LOG_LEVEL.WARN, "User tried to install a new DB on a system that is already installed");
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
                        log(LOG_LEVEL.ERROR, "The database " + req.body.type + " is not supported");
                        return;
                    }
                    else {
                        // Update the installStage and write the config file to the disk
                        config.installStage = 1;
                        config.db_type = req.body.type;
                        config.db_file = req.body.file;
                        writeFileSync(path.join(this.config.data_dir, "/config.json"), JSON.stringify(config, null, "\t"));
                        resources.db = db;
                    }
                }
                catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    log(LOG_LEVEL.ERROR, "An error occurred while initializing the database");
                    log(LOG_LEVEL.ERROR, e);
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
                log(LOG_LEVEL.WARN, "User tried to initialize a user to a system that is already fully installed");
            }
            else if (config.installStage != 1) {
                res.set("Content-Type", "application/json");
                res.status(403);
                res.send("Forbidden");
                log(LOG_LEVEL.WARN, "User tried to initialize a user with an unitialized database. Initialize the db first.");
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
                    writeFileSync(path.join(this.config.data_dir, "/config.json"), JSON.stringify(config, null, "\t"));
                } catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    log(LOG_LEVEL.ERROR, "Error encountered during default user creation");
                    console.log(LOG_LEVEL.ERROR, e);
                    return;
                }

                res.status(200);
                res.send("OK");
            }
        });

        return setup;
    }


    createLibraryApi(config) {
        var lib = Router();

        lib.get("/trackInfo/:trackId", async (req, res) => {
            log(LOG_LEVEL.DEBUG, "Getting track info for id " + req.params.trackId);
            res.setHeader("Content-Type", "application/json");
            res.send(await this.resources.db.getTracksInfo(req.params.trackId).catch(e => log(LOG_LEVEL.ERROR, e)));
        })
            .post("/tracksInfo", bodyParser.json(), handleJsonError, async (req, res) => {
                log(LOG_LEVEL.DEBUG, "Getting Track info for id " + req.body);
                res.setHeader("Content-Type", "application/json");
                res.send(await this.resources.db.getTracksInfo(req.body).catch(e => {
                    log(LOG_LEVEL.ERROR, "An error occurred while fetching infos of tracks: " + req.body.toString());
                    log(LOG_LEVEL.ERROR, e);
                    res.statusCode(500);
                    res.send("Internal server error");
                }));
            })
            .get("/track/:trackId", async (req, res) => {
                log(LOG_LEVEL.DEBUG, "Getting track descriptor of track with id " + req.params.trackId);
                var info = await this.resources.db.getTracksInfo(req.params.trackId);
                info = info[0];

                if (typeof (info) == "undefined") {
                    res.status(404);
                    res.send("Not found");
                    log(LOG_LEVEL.WARN, "Track with id " + req.params.trackId + " not found");
                    return;
                }

                info.albumDir = await this.resources.db.getAlbumDir(info.albumId).catch(e => log(LOG_LEVEL.ERROR, e));

                res.header("Content-Type", "application/xml");
                try {
                    res.send(readFileSync(path.join(this.config.data_dir, info.albumDir, info.title.replace(/\//g, "_") + ".mpd")));
                }
                catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    log(LOG_LEVEL.ERROR, "An error occurred while opening the track descriptor of track : " + req.params.trackId);
                    log(LOG_LEVEL.ERROR, e);
                }

            })
            .get("/track/:trackId/:streamId", async (req, res) => {
                if (typeof (req.headers.range) == "undefined") {
                    res.status(400);
                    res.send("Bad request");
                    log(LOG_LEVEL.WARN, "No range header provided");
                    return
                }

                if (!req.headers.range.includes("bytes")) {
                    res.status(400);
                    res.send("Bad request");
                    log(LOG_LEVEL.WARN, "Range header is not of type bytes");
                    return
                }

                var range = req.headers.range.replace(/bytes=/g, "").split("-");

                log(LOG_LEVEL.DEBUG, "Getting track segment of track " + req.params.trackId + " for stream " + req.params.streamId + " for the range " + range[0] + "-" + range[1]);

                var info = await this.resources.db.getTracksInfo(req.params.trackId);
                info = info[0];

                if (typeof (info) == "undefined") {
                    res.status(404);
                    res.send("Not found");
                    log(LOG_LEVEL.WARN, "Track with id " + req.params.trackId + " not found");
                    return;
                }

                info.albumDir = await this.resources.db.getAlbumDir(info.albumId).catch(e => log(LOG_LEVEL.ERROR, e));

                try {
                    var filePath = path.join(this.config.data_dir, info.albumDir, info.title.replace(/\//g, "_") + "-stream" + req.params.streamId + ".mp4");
                    log(LOG_LEVEL.DEBUG, filePath);

                    var file = createReadStream(filePath, { start: parseInt(range[0]), end: parseInt(range[1]) });

                    var fileStats = statSync(filePath);
                    var headers = {
                        'Content-Range': `bytes ${range[0]}-${range[1]}/${fileStats.size}`,
                        'Accept-Ranges': 'bytes',
                        'Content-Length': range[1] - range[0] + 1,
                        'Content-Type': 'audio/mp4'
                    }

                    if (req.headers["accept-encoding"].split(", ").includes("deflate")){
                        log(LOG_LEVEL.DEBUG, "Deflating the file before piping it")
                        var deflate = createDeflate();

                        delete headers["Content-Length"];
                        headers["Content-Encoding"] = "deflate";
                        res.writeHead(206, headers);
                        file.pipe(deflate).pipe(res);
                    }
                    else if (req.headers["accept-encoding"].split(", ").includes("gzip")){
                        log(LOG_LEVEL.DEBUG, "GZipping the file before piping it")
                        var gzip = createGzip();
                        
                        delete headers["Content-Length"];
                        headers["Content-Encoding"] = "gzip";
                        res.writeHead(206, headers);
                        file.pipe(gzip).pipe(res);
                    }
                    else{
                        log(LOG_LEVEL.DEBUG, req.headers);
                        res.writeHead(206, headers);
                        file.pipe(res);
                    }
                        

                }
                catch (e) {
                    res.status(500);
                    res.send("Internal server error");
                    log(LOG_LEVEL.ERROR, "An error occurred while fetching segment of stream " + req.params.streamId + " of track with id " + req.params.trackId);
                    log(LOG_LEVEL.ERROR, e);
                }


            })



        return lib;
    }



    closeOpenFiles() {
        Object.keys(this.files).forEach(key => {
            try {
                closeSync(this.files[key]);
            }
            catch (e) {
                log(LOG_LEVEL.ERROR, "An error occurred while closing a file: ");
                log(LOG_LEVEL.ERROR, e);
            }
        });
    }
}



export default Apiv1;
