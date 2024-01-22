import { Sequelize, Options, Model } from "sequelize"
import { DBInfo, RawInfo, DBMSInfo, SqliteInfo, ISequelizeDBMSInfo, ISequelizeSqliteInfo } from "./DbManager.js";

import Album from "./models/Album.js";
import Track from "./models/Track.js";
import Genre from "./models/Genre.js";
import Artist from "./models/Artists.js";
import User from "./models/User.js";
import { Logger } from "./utils/Logger.mjs";
import { exec } from "child_process";
import { CONFIG_FOLDER } from "./index.mjs";
import { writeFileSync } from "fs";
import path from "path";


export function isRawInfo(info: DBInfo): info is RawInfo {
    return typeof (info) == "object" && typeof ((info as RawInfo).uri) != "undefined";
}

export function isDBMSInfo(info: DBInfo): info is DBMSInfo {
    return typeof (info) == "object" && typeof ((info as DBMSInfo).host) != "undefined";
}

export function isSqliteInfo(info: DBInfo): info is SqliteInfo {
    return typeof (info) == "object" && typeof ((info as SqliteInfo).path) != "undefined";
}

class DbManager {
    static #instance: DbManager | null;
    static #isConstructing = false;

    #sequelize: Sequelize;
    static isConnected: boolean = false;

    /** 
     * Constructs the class. Simulates a private constructor
     * 
     * @param {dbINfo} dbData The connection information for the database
     */
    constructor(dbInfo: DBInfo) {
        if (!DbManager.#isConstructing) {
            throw new Error("Cannot use DBManager's constructor, should use GetInstance() instead")
        }

        var sequelizeConnectionString = "";

        // Initializes the connection based on the type of dbInfo
        if (isRawInfo(dbInfo)) {
            sequelizeConnectionString = dbInfo.uri;
        }

        else if (isSqliteInfo(dbInfo)) {
            sequelizeConnectionString = `sqlite:${dbInfo.path}`;
        }

        else if (isDBMSInfo(dbInfo)) {
            sequelizeConnectionString = typeof(dbInfo.port) == "undefined" ? 
            `${dbInfo.type}://${dbInfo.username}:${dbInfo.password}@${dbInfo.host}/${dbInfo.database}`
            : `${dbInfo.type}://${dbInfo.username}:${dbInfo.password}@${dbInfo.host}:${dbInfo.port}/${dbInfo.database}`;
        }

        this.#sequelize = new Sequelize(sequelizeConnectionString, { logging: false });

        this.#setupSequelizeInfo(dbInfo)
    }


    async connect(): Promise<boolean> {
        try {
            await this.#sequelize.authenticate();
            DbManager.isConnected = true;
            return true;
        } catch (error) {
            Logger.err('Unable to connect to the database: '+ error);
            Logger.err(error);
        }
        return false;
    }

    async close() {
        try {
            await this.#sequelize.close();
            DbManager.#instance = null;
            return true;
        } catch (error) {
            Logger.err('Unable to close the database');
            Logger.err(error);
        }
        DbManager.#instance = null;
        return false;
    }

    static getInstance(dbData: DBInfo): DbManager {

        // Creates the database manager if none is present
        if (DbManager.#instance == null) {
            DbManager.#isConstructing = true;
            DbManager.#instance = new DbManager(dbData);
        }

        return DbManager.#instance;
    }

    static getExistingInstance(): DbManager | null {
        return DbManager.#instance;
    }

    async setupModels() {

        await User.init(User.modelAttributes, {sequelize: this.#sequelize});
        await Artist.init(Artist.modelAttributes, {sequelize: this.#sequelize, timestamps: false});
        await Album.init(Album.modelAttributes, {sequelize: this.#sequelize, timestamps: false});
        await Track.init(Track.modelAttributes, {sequelize: this.#sequelize, timestamps: false});
        await Genre.init(Genre.modelAttributes, {sequelize: this.#sequelize, timestamps: false});

        // Declaring associations
        Album.hasMany(Track, { foreignKey: "albumId" });
        Track.belongsTo(Album, {foreignKey: "albumId"});

        Track.belongsToMany(Genre, { through: "TrackGenres", foreignKey: "trackId", timestamps: false});
        Genre.belongsToMany(Track, { through: "TrackGenres", foreignKey: "genreId", timestamps: false});

        Artist.hasMany(Track, {foreignKey: "artistId", sourceKey: "id"});
        Track.belongsTo(Artist, { foreignKey: "artistId"});

        await this.#sequelize.sync();
    }


    #setupSequelizeInfo(dbInfo: DBInfo): void{
        var sequelizeInfo: ISequelizeSqliteInfo | ISequelizeDBMSInfo;
        
        if(isSqliteInfo(dbInfo)){
            sequelizeInfo = {
                dialect: "sqlite",
                storage: dbInfo.path
            }

            writeFileSync(path.join(CONFIG_FOLDER, "databases.json"), JSON.stringify({production: sequelizeInfo}, null, 4));
        }
        else if(isDBMSInfo(dbInfo)){
            sequelizeInfo =  {
                dialect: dbInfo.type,
                username: dbInfo.username,
                password: dbInfo.password,
                host: dbInfo.host,
                database: dbInfo.database,
            }

            if(typeof(dbInfo.port) != "undefined"){
                sequelizeInfo.port = dbInfo.port;
            }

            writeFileSync(path.join(CONFIG_FOLDER, "databases.json"), JSON.stringify({production: sequelizeInfo}, null, 4));
        }
        else if(isRawInfo(dbInfo)){
            var dbmsRegex = /([a-z]*):\/\/([\w]*):([\w]*)@([\w\.]*)(:[0-9]+)?\/(\w*)/i
            var sqliteRegex = /([a-z]*)(\:\/\/)?(.*)/i

            var dbInfoMatch = dbInfo.uri.match(dbmsRegex);
            if(dbInfoMatch != null){
                sequelizeInfo = {
                    dialect: dbInfoMatch[1],
                    username: dbInfoMatch[2],
                    password: dbInfoMatch[3],
                    host: dbInfoMatch[4],
                    database: dbInfoMatch[6]
                }

                if(dbInfoMatch[5] != null){
                    sequelizeInfo.port = parseInt(dbInfoMatch[5].replace(":", ""));
                }

                writeFileSync(path.join(CONFIG_FOLDER, "databases.json"), JSON.stringify({production: sequelizeInfo}, null, 4));
            }
            else{
                dbInfoMatch = dbInfo.uri.match(sqliteRegex);
                if(dbInfoMatch != null){
                    sequelizeInfo = {
                        dialect: "sqlite",
                        storage: dbInfoMatch[3]
                    }

                    writeFileSync(path.join(CONFIG_FOLDER, "databases.json"), JSON.stringify({production: sequelizeInfo}, null, 4));
                }

            }
        }

        
    }

    static migrate(): Promise<void>{
        return new Promise((resolve, reject) => {
            exec(
                'npx sequelize db:migrate --env production',
                {env: process.env},
                err=>{err? reject(err) : resolve()}
            )
        })
    }
}

export default DbManager;