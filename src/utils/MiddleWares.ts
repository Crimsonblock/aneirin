import DbManager from "../DbManager.mjs";
import { HTTP_CODES } from "../HTTPCodes.js";
import AuthenticationToken from "../models/AuthenticationToken.js";
import User from "../models/User.js";
import { Logger } from "./Logger.mjs";
import { Request } from "express";

// (req: any, res: any, next: any) => {}

export interface AuthenticatedRequest extends Request{
    user?: User
}


// Makes sure the user is authenticated and atatches its object to the request
export function requireAuthentication(){
    return async (req: AuthenticatedRequest, res: any, next: any)=>{
        if(typeof(req.headers.authorization) == "undefined"){
            res.status(HTTP_CODES.UNAUTHORIZED);
            res.send();
            return;
        }
    
        var bearerRegex = /Bearer (\w+)/
    
        var bearer = req.headers.authorization.match(bearerRegex);
    
        if(bearer == null){
            res.status(HTTP_CODES.UNAUTHORIZED);
            res.send();
            return;
        }
    
        var authToken: AuthenticationToken | null = await AuthenticationToken.findOne({
            where:{
                // @ts-ignore
                id: atob(bearer[1])
            }
        })
    
        if(authToken == null){
            res.status(HTTP_CODES.UNAUTHORIZED);
            res.send();
            return;
        }
    
        var user: User | null = await authToken.getUser();
    
        if(user == null){
            Logger.err("Token had no corresponding user");
            res.status(HTTP_CODES.INTERNAL_SERVER_ERROR);
            res.send("Internal server error");
        }
        req.user = user;
        next();
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

