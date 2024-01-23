import { Router } from "express";
import { HTTP_CODES } from "../HTTPCodes.js";
import bodyParser from "body-parser";
import User, { IUser } from "../models/User.js";
import { Logger } from "../utils/Logger.mjs";
import DbManager, { isDBMSInfo, isRawInfo, isSqliteInfo } from "../DbManager.mjs";
import { getConfig, saveConfig } from "../utils/utils.mjs";
import { dbManagerMustBeConnected, limitMethods } from "../utils/MiddleWares.js";
import { DBInfo } from "../DbManager.js";
import { Op } from "sequelize";
/**
* Required api endpoints: 
*  Admin:
*      - To create the first admin user*    <- Done
*      - To setup the DB connection         <- Done
*      - Remove track/artist/album* %
*      - Update track/artist/album* %
*      - Add/remove/update folders to be scanned
*                           L> that contain music tracks
*      - Add/remove users* %
*      - Change user password* %
* 
*  User:
*      - Change password* %
*      - Change email* %
*      - Create playlist* %
*      - Update playlist* %
*      - Login*     
*      - Register*
*      - Get Salt*  <- Done
* 
*  Playback:
*      - Retrieve tracks infos*
*      - Retrieve music (206)*
* 
*  Files: 
*      - Create new file %
*      - Upload file segment %
*      - Conclude file upload %
*      - Scan files and update in the db* %
*
*   Endpoints marked with "*" require the database to be connected
*   Endpoints marked with "%" require the user to be connected, even when the instance is in public mode
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
        app.use("/user", this.createUserApi());
        
        return app;
    }
    
    // Creates the administrator endpoints
    createAdminApi(): Router{
        var adminApi = Router();
        adminApi.use(bodyParser.json());
        
        // Used to create the first, administrator user. This can only be called once, at setup.
        adminApi.use("/createFirstUser", 
        limitMethods(["POST"]), 
        dbManagerMustBeConnected(),
        async (req, res) =>{ 
            // Ensures the endpoint is only callable the first time
            if(!this.#allowFirstUserCreation){
                res.status(HTTP_CODES.FORBIDDEN);
                res.send("Action not permitted\n");
            }
            
            // Checks that all the required fields are present
            else if(typeof(req.body.username) === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing username\n");
            }
            else if(typeof(req.body.password) === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing password\n");
            }
            else if(typeof(req.body.salt) === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing salt\n");
            }

            else{
                // Creates the first admin user in the database
                try{
                    var user: IUser = {
                        username: req.body.username,
                        password: req.body.password,
                        salt: req.body.salt,
                        isAdmin: true
                    }
                    if(typeof(req.body.email) !== "undefined")
                    user.email = req.body.email;
                    await User.create(user);

                    res.status(HTTP_CODES.OK);
                    res.send();
                    this.#allowFirstUserCreation = false;
                }
                // Handles errors with the creation. It is simply log as there should not 
                // be any conflict since this is the first user.
                catch(e){
                    Logger.err("An error occurred while creating the first user:")
                    Logger.err(e);
                    res.status(HTTP_CODES.INTERNAL_SERVER_ERROR);
                    res.send("An error occurred while creating the first user, verify logs\n");
                }
            }
        });
        
        // Used to initialize the database setup.
        adminApi.use("/initialDbSetup", limitMethods(["POST"]), async (req, res) =>{            
            // This endpoint is only allowed for the initial db setup
            if(!this.#allowFirstDbSetup){
                res.status(HTTP_CODES.FORBIDDEN);
                res.send("Action not permitted\n");
                return;
            } 

            // Checks if the body is a valid DBInfo object
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
        });
        
        
        return adminApi;
    }

    createUserApi(): Router{
        var userApi = Router();
        userApi.use(dbManagerMustBeConnected());

        userApi.use("/authenticate", limitMethods(["POST"]), bodyParser.json(), (req, res) =>{
            if(req.body.username === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing username");
            }
            else if(req.body.password === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing password");
            }

            
        });


        userApi.use("/getSalt", limitMethods(["GET"]), async (req, res) =>{
            if(typeof(req.query.username) === "undefined"){
                res.status(HTTP_CODES.BAD_REQUEST);
                res.send("Missing username");
                return;
            }

            var user: User = await User.findOne({
                // @ts-ignore
                where:{
                    [Op.or]: [
                        {username: req.query.username},
                        {email: req.query.username}
                    ]
                }
            })

            if(user == null){
                res.status(HTTP_CODES.NOT_FOUND);
                res.send();
                return;
            }

            res.header("Content-Type", "text/plain");
            res.send(user.salt);
        });

        return userApi;
    }
}

export default Cithar