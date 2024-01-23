import DbManager from "../DbManager.mjs";
import { HTTP_CODES } from "../HTTPCodes.js";
import { Logger } from "./Logger.mjs";

// (req: any, res: any, next: any) => {}

// Makes sure the user is authenticated and atatches its object to the request
export function authenticate(req: any, res: any, next: any){
    if(typeof(req.headers.authorization) == "undefined"){
        res.status(HTTP_CODES.UNAUTHORIZED);
        res.send();
        return;
    }
}

// Limits the allowed methods
export function limitMethods(allowedMethods: Array<String>){
    return (req: any, res: any, next: any) =>{
        if(allowedMethods.includes(req.method)){
            next()
        }
        else{
            res.status(HTTP_CODES.METHOD_NOT_ALLOWED);
            res.send("Method not allowed");
        }
    }
}

// Makes sure the database is connected
export function dbManagerMustBeConnected(){
    return (req: any, res: any, next: any) =>{
        if(!DbManager.isConnected){
            res.status(HTTP_CODES.BAD_REQUEST);
            res.send("Bad request\n");
            Logger.warn("Trying to perform an action before connecting to the database: ")
            Logger.warn(req.path);
        }
        else(next());
    }
}

