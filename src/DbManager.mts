import { Sequelize, Options, Model } from "sequelize"
import { DBInfo, RawInfo, DBMSInfo, SqliteInfo } from "./DbManager.js";

import Album from "./models/Album.js";
import Track from "./models/Track.js";
import Genre from "./models/Genre.js";
import Artist from "./models/Artists.js";
import User from "./models/User.js";
import { Logger } from "./utils/Logger.mjs";


function isRawInfo(info: DBInfo): info is RawInfo {
    return typeof (info) == "object" && typeof ((info as RawInfo).uri) != "undefined";
}

function isDBMSInfo(info: DBInfo): info is DBMSInfo {
    return typeof (info) == "object" && typeof ((info as DBMSInfo).host) != "undefined";
}

function isSqliteInfo(info: DBInfo): info is SqliteInfo {
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
    constructor(dbData: DBInfo) {
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
            sequelizeConnectionString = typeof(dbData.port) == "undefined" ? 
            `${dbData.type}://${dbData.username}:${dbData.password}@${dbData.host}/${dbData.database}`
            : `${dbData.type}://${dbData.username}:${dbData.password}@${dbData.host}:${dbData.port}/${dbData.database}`;
        }

        this.#sequelize = new Sequelize(sequelizeConnectionString, { logging: false });
    }


    async connect(): Promise<boolean> {
        try {
            await this.#sequelize.authenticate();
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
        if (DbManager.#instance == null) {
            DbManager.#isConstructing = true;
            DbManager.#instance = new DbManager(dbData);
        }

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
}

export default DbManager;