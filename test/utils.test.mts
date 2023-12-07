import process from "process";
import { IConfig, getConfig, processEnvironmentVariables, saveConfig } from "../src/utils/utils.mts";
import { LOG_LEVEL, Logger } from "../src/utils/Logger.mts";
import { existsSync, readFileSync, rmSync, rmdirSync, writeFileSync } from "fs";

describe("Checks the utils process variables works as expected", () => {
    
    let defaultEnv: any;
    
    beforeAll(() => {
        defaultEnv = { ...process.env }
        defaultEnv.LOG_LEVEL = "NONE";
    })
    
    afterEach(() => {
        process.env = { ...defaultEnv };
    })
    
    it("Should be undefined when no environment variables", () => {
        expect(processEnvironmentVariables()).toBe(undefined);
    });
    
    it("Should return an object when memory database", () => {
        process.env.DB_TYPE = "memory";
        expect(processEnvironmentVariables()).toEqual({ uri: "sqlite::memory:" });
    })
    
    it("Should be undefined when sqlite is set and no path is provided", () => {
        process.env.DB_TYPE = "sqlite";
        expect(processEnvironmentVariables()).toBe(undefined);
    })
    
    it("Should be defined when sqlite is set and a path is provided", () => {
        process.env.DB_TYPE = "sqlite";
        process.env.DB_FILE = "/test.dev";
        expect(processEnvironmentVariables()).toEqual({ path: "/test.dev" });
    })
    
    it("Should be undefined when mysql is set and nothing else is provided", () => {
        process.env.DB_TYPE = "mysql";
        expect(processEnvironmentVariables()).toBe(undefined);
    })
    
    it("Should be undefined when mysql is set and only a database is provided", () => {
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        expect(processEnvironmentVariables()).toBe(undefined);
    })
    
    it("Should be undefined when mysql is set and only a database and host is provided", () => {
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        expect(processEnvironmentVariables()).toBe(undefined);
    })
    
    it("Should be undefined when mysql is set and only a database, host and username is provided", () => {
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        process.env.DB_USERNAME = "test";
        
        expect(processEnvironmentVariables()).toBe(undefined);
    })
    
    it("Should be defined when all information is included", () => {
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        process.env.DB_USERNAME = "test";
        process.env.DB_PASSWORD = "test";
        
        expect(processEnvironmentVariables())
        .toEqual({
            type: "mysql",
            username: "test",
            password: "test",
            host: "localhost",
            database: "test"
        });
    })
    
    it("... Even with another db type", () => {
        process.env.DB_TYPE = "postgres";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        process.env.DB_USERNAME = "test";
        process.env.DB_PASSWORD = "test";
        
        expect(processEnvironmentVariables())
        .toEqual({
            type: "postgres",
            username: "test",
            password: "test",
            host: "localhost",
            database: "test"
        });
    })
    
    
    it("Should be defined and include a port when all information is included in additio nto a port", () => {
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        process.env.DB_USERNAME = "test";
        process.env.DB_PASSWORD = "test";
        process.env.DB_PORT = "3306";
        
        expect(processEnvironmentVariables())
        .toEqual({
            type: "mysql",
            username: "test",
            password: "test",
            host: "localhost",
            database: "test",
            port: 3306
        });
    })
    
    
});


describe("Checks getConfig and saveConfig work as expected", ()=>{
    afterAll(()=>{
        rmdirSync("./config", {recursive: true})
    })
    
    afterEach(()=>{
        try{
            rmSync("./config/config.json");
        }
        catch(e){
        }
    })
    
    
    it("Should return an empty object", ()=>{
        expect(getConfig()).toEqual({})
    });
    
    it("Should create a config folder", ()=>{
        var config:any = getConfig();
        expect(existsSync("./config/")).toBe(true);
    })
    
    it("should create a config file", async ()=>{
        var config: IConfig = getConfig();
        await saveConfig(config);
        expect(existsSync("./config/config.json")).toBe(true);
    })
    
    it("Should refuse to save a wrong config object", async()=>{
        try{
            // @ts-expect-error
            await saveConfig(123);
        }
        catch(e){
            expect(e).toMatch("saveConfig expects a parameter of type Object implementing interface IConfig")
        }
    })
    
    it("Should create a config file containing the right config", async ()=>{
        await saveConfig({
            dbInfo: {
                type: "mysql",
                host: "localhost",
                username: "test",
                password: "test",
                database: "test"
            }
        });
        
        expect(JSON.parse(readFileSync("config/config.json").toString())).toEqual({
            dbInfo: {
                type: "mysql",
                host: "localhost",
                username: "test",
                password: "test",
                database: "test"
            }
        })
        
        
    })
    
    it("Should correctly load a config file", ()=>{
        writeFileSync("config/config.json", JSON.stringify({test: "test"}));
        
        expect(getConfig()).toEqual({test: "test"});
    })
    
    it("Should correctly load config from environment variables", ()=>{
        process.env.DB_TYPE = "mysql";
        process.env.DB_NAME = "test";
        process.env.DB_HOST = "localhost";
        process.env.DB_USERNAME = "test";
        process.env.DB_PASSWORD = "test";
        
        expect(getConfig())
        .toEqual({
            dbInfo:{
                type: "mysql",
                username: "test",
                password: "test",
                host: "localhost",
                database: "test"
            }
        });
    });
    
});



