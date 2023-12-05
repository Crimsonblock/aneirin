import process from "process";
import { processEnvironmentVariables } from "../src/utils/utils.mts";
import { LOG_LEVEL, Logger } from "../src/utils/Logger.mts";

describe("Checks the utils manager works as expected", () => {

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