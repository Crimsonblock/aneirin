import { Router } from "express";

export var api = Router();

api.get("/", (req, res)=>{
    res.send("v1.0");
});

api.post("/setup", (req, res)=>{
    
});