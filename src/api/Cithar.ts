import { Router } from "express";
import { HTTP_CODES } from "../HTTPCodes.js";
import bodyParser from "body-parser";
import User from "../models/User.js";
import { Logger } from "../utils/Logger.mjs";
import DbManager, { isDBMSInfo, isRawInfo, isSqliteInfo } from "../DbManager.mjs";
import { getConfig, saveConfig } from "../utils/utils.mjs";
import { dbManagerMustBeConnected, limitMethods } from "../MiddleWares.js";
import { DBInfo } from "../DbManager.js";

/**
* Required api endpoints: 
*  Admin:
*      - To create the first admin user     <- Done
*      - To setup the DB connection         <- Done
*      - Remove track/artist/album
*      - Update track/artist/album
*      - Upload tracks
*      - Add/remove/update folders to be scanned
*                           L> that contain music tracks
* 
*  User:
*      - Change password
*      - Change email
*      - Create playlist
*      - Update playlist
* 
*  Playback:
*      - Retrieve tracks infos
*      - Retrieve music (206)
* 
*  Files: 
*      - Create new file
*      - Upload file segment
*      - Conclude file upload
*      - Scan files and update in the db
*/

class Cithar {
    #allowFirstUserCreation = false;
    #allowFirstDbSetup = false;
    
    constructor(allowFirstDbSetup = false, allowFirstUserCreation = false){
        this.#allowFirstUserCreation = allowFirstUserCreation;
        this.#allowFirstDbSetup = allowFirstDbSetup;
    }
    
    getApi(): Router {
        var app = Router();
        app.use("/admin", this.createAdminApi());
        
        return app;
    }
    
    
    createAdminApi(): Router{
        var adminApi = Router();
        adminApi.use(bodyParser.json());
        
        
        adminApi.use("/createFirstUser", 
        limitMethods(["POST"]), 
        dbManagerMustBeConnected(),
        async (req, res) =>{ 
            // This endpoint is only allowed for the first user
            if(!this.#allowFirstUserCreation){
                res.status(HTTP_CODES.FORBIDDEN);
                res.send("Action not permitted\n");
            }
            
            // Checks that all the required fields are present
            else if(typeof(req.body.username) == "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing username\n");
            }
            else if(typeof(req.body.password) == "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing password\n");
            }
            else if(typeof(req.body.salt) == "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing salt\n");
            }            
            else{
                // Handles the case where the database connection is not done or has cut
                try{
                    await User.create({
                        username: req.body.username,
                        password: req.body.password,
                        salt: req.body.salt,
                        isAdmin: true
                    });
                    res.status(HTTP_CODES.OK);
                    res.send();
                    this.#allowFirstUserCreation = false;
                }
                catch(e){
                    Logger.err(e);
                    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR);
                    res.send("An error occurred while creating the first user, verify logs\n");
                }
            }
        });
        
        adminApi.use("/initialDbSetup", limitMethods(["POST"]), async (req, res) =>{            
            // This endpoint is only allowed for the initial db setup
            if(!this.#allowFirstDbSetup){
                res.status(HTTP_CODES.FORBIDDEN);
                res.send("Action not permitted\n");
                return;
            } 
            else if(isRawInfo(req.body) || isDBMSInfo(req.body) || isSqliteInfo(req.body)) {
                var dbInfo: DBInfo = req.body;
                Logger.dLog("Valid db information recieved:");
                Logger.dLog(dbInfo);

                var dbMan = DbManager.getInstance(dbInfo);
                
                Logger.dLog("Performing initial database migration");
                await DbManager.migrate();
                Logger.dLog("Done, connecting to the database");

                if(await dbMan.connect()){
                    try{
                        Logger.dLog("Done, setting the models up...");
                        await dbMan.setupModels();
                        var config = await getConfig();
                        config.dbInfo = dbInfo;
                        await saveConfig(config);

                        Logger.dLog("Initial database setup done");
                        res.status(HTTP_CODES.OK);
                        res.send();
                    }
                    catch(e){
                        Logger.err("Unable to connect to the database with the following information:");
                        Logger.err(dbInfo);
                        res.status(HTTP_CODES.INTERNAL_SERVER_ERROR);
                        res.send("Internal server error");
                    }
                }
                else{
                    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR);
                    res.send("Internal server error");
                    Logger.err("Unable to connect to the databse")
                }


            }
            else{
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Invalid database information format");
            }
        })
        
        
        return adminApi;
    }
}

export default Cithar