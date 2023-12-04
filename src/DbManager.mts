import { Sequelize, Options, Model } from "sequelize"
import { dbInfo, RawInfo, DBMSInfo, SqliteInfo } from "./DbManager.js";



function isRawInfo(info: dbInfo): info is RawInfo {
    return typeof (info) == "object" && typeof ((info as RawInfo).uri) != "undefined";
}

function isDBMSInfo(info: dbInfo): info is DBMSInfo {
    return typeof (info) == "object" && typeof ((info as DBMSInfo).host) != "undefined";
}

function isSqliteInfo(info: dbInfo): info is SqliteInfo {
    return typeof (info) == "object" && typeof ((info as SqliteInfo).path) != "undefined";
}

class DbManager {
    static #instance: DbManager | null;
    static #isConstructing = false;


    #sequelize: Sequelize;
    #isConnected: boolean = false;

    /** 
     * Constructs the class. Simulates a private constructor
     * 
     * @param {dbINfo} dbData The connection information for the database
     */
    constructor(dbData: dbInfo) {
        if (!DbManager.#isConstructing) {
            throw new Error("Cannot use DBManager's constructor, should use GetInstance() instead")
        }

        var sequelizeConnectionString = "";

        // Initializes the connection based on the type of dbInfo
        if (isRawInfo(dbData)) {
            sequelizeConnectionString = dbData.uri;
        }

        else if (isSqliteInfo(dbData)) {
            sequelizeConnectionString = `sqlite:${dbData.path}`;
        }

        else if (isDBMSInfo(dbData)) {
            sequelizeConnectionString = `${dbData.type}://${dbData.username}:${dbData.password}@${dbData.host}:${dbData.port}/${dbData.database}`;
        }

        this.#sequelize = new Sequelize(sequelizeConnectionString, {logging: false});
    }


    async connect(): Promise<boolean> {
        try {
            await this.#sequelize.authenticate();
            return true;
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
        return false;
    }

    async close() {
        try {
            await this.#sequelize.close();
            DbManager.#instance = null;
            return true;
        } catch (error) {
            console.error('Unable to close the database:', error);
        }
        DbManager.#instance = null;
        return false;
    }

    static getInstance(dbData: dbInfo): DbManager {
        if (DbManager.#instance == null) {
            DbManager.#isConstructing = true;
            DbManager.#instance = new DbManager(dbData);
        }

        return DbManager.#instance;
    }

    getSequelize(): Sequelize{
        return this.#sequelize;
    }
}

export default DbManager;