import { LOG_LEVEL } from "../utils.mjs";
import DbManager from "./DbManager.mjs";
import sqlite3 from "sqlite3";

// TODO add Tags, playlists and maybe tokens table.

const SEARCH_LIMIT = 5;
const DEFAULT_LIMIT=10;

class SqliteManager extends DbManager {
    constructor() {
        super();
        this.db = null;
    }

    /**
     * Connects to the db and stores the relevant information inside the object
     * @param credentials An object containing a "file" key that indicates the path to the db file.
     */
    connect(credentials) {
        if (typeof (credentials.file) == "undefined") throw new Error("No file provided");
        this.db = new sqlite3.Database(credentials.file);
    }

    /**
     * Instantiates the db with the correct structure.
     * 
     * REQUIRED fields are:
     * 
     *      track: id, title, artist(or artist id for references), album(or albumID for references), track number, genre*
     *      album: name, artist id, path to cover image
     *      artist: name, path to picture
     * 
     *      *For RDBMS, a separate table with the genres name and an additional joint table are encouraged.
     */
    install() {
        if (this.db == null) throw new Error("DB not yet connected");
        this.db.serialize(() => {
            // Creates the artist table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "artists" (\
                "id" INTEGER NOT NULL UNIQUE, \
                "name" TEXT NOT NULL UNIQUE, \
                "picturePath" TEXT, \
                PRIMARY KEY("id" AUTOINCREMENT)\
            )');
            // Creates the albums table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS"albums" (\
                "id"	INTEGER NOT NULL UNIQUE,\
                "name"	TEXT NOT NULL,\
                "cover"	TEXT,\
                "path"	TEXT NOT NULL,\
                CONSTRAINT "uniqueAlbum" UNIQUE("name"),\
                PRIMARY KEY("id" AUTOINCREMENT)\
            )');
            // Creates the tracks table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "tracks" (\
                "id"	INTEGER NOT NULL UNIQUE,\
                "title"	TEXT NOT NULL,\
                "artistId"	INTEGER NOT NULL,\
                "albumId"	INTEGER NOT NULL,\
                "composer"	TEXT,\
                "trackNr"	INTEGER,\
                "diskNr"	INTEGER,\
                "year"	INTEGER,\
                "duration"	INTEGER NOT NULL,\
                CONSTRAINT "uniqueTrack" UNIQUE("title","albumId","artistId"),\
                PRIMARY KEY("id" AUTOINCREMENT),\
                CONSTRAINT "trackArtistId" FOREIGN KEY("artistId") REFERENCES "artists"("id"),\
                CONSTRAINT "trackAlbumId" FOREIGN KEY("albumId") REFERENCES "albums"("id")\
            )');

            // Creates the genres table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "genres"(\
                "id" INTEGER NOT NULL UNIQUE, \
                "name" TEXT NOT NULL UNIQUE, \
                PRIMARY KEY("id" AUTOINCREMENT)\
            )');

            // Creates the tracks genres table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "trackGenres"(\
                "id" INTEGER NOT NULL UNIQUE,\
                "trackId" INTEGER NOT NULL,\
                "genreId" INTEGER NOT NULL,\
                PRIMARY KEY("id" AUTOINCREMENT),\
                CONSTRAINT "trackGenresTrackId" FOREIGN KEY("trackId") REFERENCES tracks("id"),\
                CONSTRAINT "trackGenresGenreId" FOREIGN KEY("genreId") REFERENCES genres("id")\
            )')

            // Creates the users table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "users"(\
                "id" INTEGER NOT NULL UNIQUE,\
                "username" TEXT NOT NULL UNIQUE,\
                "password" TEXT NOT NULL,\
                "isAdmin" INTEGER NOT NULL,\
                PRIMARY KEY("id" AUTOINCREMENT)\
            )')
        });
    }

    /**
     * Search the db for a field in track title, artist, composer or album containing the searched name.
     * @param name The name to be searched in the db 
     * 
     * @returns an array of JSON object with the fields matching the criteria.
     *  e.g. 
     */
    async search(name) {

        var flashName = "%" + name + "%";
        var result = {
            artists: [],
            albums: [],
            tracks: [],
            playlist: [],
            genres: []
        };

        return new Promise((resolve, reject) => {
            var trackStmt = this.db.prepare(`SELECT tracks.id AS trackId, tracks.title, 
                tracks.trackNr, 
                tracks.diskNr, 
                tracks.year, 
                tracks.duration, 
                albums.id AS albumId, 
                albums.name AS albumName, 
                artists.id AS artistId, 
                artists.name AS artistName 
            FROM tracks 
            INNER JOIN albums ON tracks.albumId=albums.id
            INNER JOIN artists ON tracks.artistId=artists.id 
            WHERE tracks.title LIKE ?`);
            trackStmt.all(flashName, async (err, res) => {
                if (err) reject(err);
                result.tracks = res;

                var albumStmt = this.db.prepare(`SELECT A.year,
                    A.albumId,
                    A.albumName,
                    json_group_array(DISTINCT B.artistId) as artistIds,
                    json_group_array(DISTINCT B.artistName) as artistNames,
                    json_group_array(DISTINCT C.trackTitle) as trackTitles,
                    json_group_array(DISTINCT C.trackId) as trackIds
                FROM 
                (SELECT DISTINCT
                    tracks.year, 
                    albums.id AS albumId, 
                    albums.name AS albumName
                FROM tracks 
                INNER JOIN albums ON tracks.albumId=albums.id
                WHERE albumName like ?
                ) as A, 
                (SELECT DISTINCT artists.id as artistId,
                    artists.name as artistName
                FROM tracks
                INNER JOIN albums ON tracks.albumId=albums.id
                INNER JOIN artists ON tracks.artistId=artists.id
                WHERE albums.name like ?
                LIMIT `+ SEARCH_LIMIT + `
                ) AS B,
                (SELECT DISTINCT tracks.title as trackTitle,
                    tracks.id as trackId
                FROM tracks
                INNER JOIN albums ON tracks.albumId=albums.id
                INNER JOIN artists ON tracks.artistId=artists.id
                WHERE albums.name like ?
                ORDER BY tracks.trackNr
                LIMIT `+ SEARCH_LIMIT + `)
                AS C
                GROUP BY A.albumId`);
                albumStmt.all(flashName, flashName, flashName, (err, res) => {
                    if (err) reject(err);
                    result.albums = res;

                    /*This query is split in A, B and C for to reasons:
                        -it allows to order the tracks and albums in an arbitrary way 
                            (e.g. by number of times listened to by the current user over the past month, year, ...).
                        -it allows to limit the number of tracks/albums selected
                    */

                    var artistStmt = this.db.prepare(`SELECT A.id, 
                        A.name, 
                        A.picturePath,
                        json_group_array(DISTINCT B.id) as trackIds,
                        json_group_array(DISTINCT C.id) as albumIds
                    FROM (
                        SELECT * FROM artists
                        WHERE artists.name LIKE ?
                    ) AS A,
                    (SELECT 
                        tracks.id
                    FROM tracks 
                    LEFT JOIN artists ON tracks.artistId=artists.id
                    WHERE artists.name LIKE ?
                    ORDER BY tracks.trackNr
                    LIMIT +`+ SEARCH_LIMIT + `
                    ) as B,
                    (
                    SELECT DISTINCT albums.id FROM tracks
                    INNER JOIN artists ON tracks.artistId=artists.id
                    INNER JOIN albums ON tracks.albumId=albums.id
                    WHERE artists.name LIKE ?
                    LIMIT `+ SEARCH_LIMIT + `
                    ) AS C
                    GROUP BY a.id`)

                    artistStmt.all(flashName, flashName, flashName, (err, res) => {
                        if (err) reject(err);
                        result.artists = res;

                        var genresStmt = this.db.prepare("SELECT * FROM genres WHERE name LIKE ?");
                        genresStmt.all(flashName, (err, res) => {
                            if (err) reject(err);
                            result.genres = res;
                            resolve(result);
                        });
                    })
                        .finalize();


                }).finalize();

            }).finalize();

        });
    }

    /**
     * Adds a new track to the database.
     * @param infos A JSON object containing these informations:
     *      title:      The title of the new track
     *      artistId:   The id of the artist who interpreted the song
     *      albumId:    The id of the album the title belongs to
     *      composer*:  The name of the track's composer
     *      trackNr:    The number of the track in the album
     *      diskNr*:    The number of the disk in the album
     *      year*:      The year the track was released in
     *      genre:      The genre of the track
     *      path:       The path to the track's files
     *      
     *  Fields marked by * are optionals.
     */
    async addNewTrack(infos) {
        return new Promise((resolve, reject) => {
            if (typeof (infos.title) == "undefined") reject("Title is required to add a new track");
            if (typeof (infos.artistId) == "undefined") reject("Artist id is required to add a new track");
            if (typeof (infos.albumId) == "undefined") reject("Album id is required to add a new track");
            if (typeof (infos.trackNr) == "undefined") reject("Track number is required to add a new track");
            if (typeof (infos.genre) == "undefined") reject("Genre is required to add a new track");
            if (typeof (infos.duration) == "undefined") reject("Missing track's duration")


            var genresId = [];


            if (typeof (infos.genre) == "string") {

                this.db.prepare("SELECT id FROM genres WHERE name=?").get(infos.genre, (err, row) => {
                    if (err) reject(err);

                    if (typeof (row) == "undefined") {
                        this.db.serialize(() => {
                            this.db.prepare("INSERT INTO genres(name) VALUES(?)").run(infos.genre).finalize();
                            this.db.prepare("SELECT id FROM genres WHERE name=?").get(infos.genre, (err2, row2) => {
                                if (err2) reject(err2);
                                genresId.push(row2.id);
                            }).finalize();
                        });
                    }
                    else {
                        genresId.push(row.id);
                    }

                }).finalize();

            }
            else if (typeof (infos.genre) == "object") {
                var stmt = this.db.prepare("SELECT id FROM genres WHERE name=?");
                infos.genre.forEach(genre => {
                    stmt.get(genre, row => {
                        if (typeof (row) == "undefined") {
                            this.db.serialize(() => {
                                this.db.prepare("INSERT INTO genres(name) VALUES(?)").run(genre).finalize();
                                stmt.get(genre, row2 => {
                                    genresId.push(row2.id);
                                });
                            });
                        }
                        else {
                            genresId.push(row.id);
                        }
                    });
                });
                stmt.finalize();
            }
            else reject("Genres must be a string or an array of strings");


            this.db.prepare("INSERT INTO tracks(title, artistId, albumId, composer, trackNr, diskNr, year, duration) VALUES(?,?,?,?,?,?,?,?)")
                .run(infos.title, infos.artistId, infos.albumId, infos.composer, infos.trackNr, infos.diskNr, infos.year, infos.duration, err => {
                    if (err) reject(err);


                    this.db.prepare("SELECT * FROM tracks WHERE title=? AND albumId=? AND artistId=?")
                        .get(infos.title, infos.albumId, infos.artistId, (err, row) => {
                            if (err) reject(err);
                            var stm = this.db.prepare("INSERT INTO trackGenres(trackId, genreId) VALUES (?,?)");
                            genresId.forEach(id => {
                                stm.run(row.id, id, err => {
                                    if (err) reject(err);
                                });
                            });
                            stm.finalize();
                            resolve();

                        }).finalize();
                });

        })

    }

    /**
     * Gets informations about tracks that match the provided search criteria. The function needs to throw an error with the message "Invalid id provided"
     * or if the id is not of type number.
     * @param criteria A JSON object containing the search criteria. Valid fields are 
     * the same as the "infos" object in the "addNewTrack" method, in addition with an "id" field,
     * corresponding to the track id.
     * 
     * @returns an array containing all the tracks matching the search criteria.
     */
    getTracks(criteria, limit=-1) {
        return new Promise((resolve, reject) => {
            var searchS = "SELECT * FROM tracks WHERE ";
            var searchV = [];
            Object.keys(criteria).forEach(k => {
                searchS += searchV.length > 0 ? " AND " + k + "=?" : k + "=?";
                searchV.push(criteria[k]);
            });

            
            if(limit != -1)
                searchS += " LIMIT "+limit;

            var stmt = this.db.prepare(searchS, (err) => {
                if (err != null) console.log("An error occured while getting the albums: ", err);
            });


            stmt.get(searchV, (err, row) => {

                if (err) {
                    reject(err);
                }
                resolve(row);
            });
        });
    }


    /**
     * Updates a track with the provided information. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param infos A JSON object containing the informations to be updated. The fields of the JSON object
     * are the same as the "infos" field in the "addNewTrack" method, in addition with a mandatory "id" field.
     */
    updateTrack(infos) {
        throw new Error("updateTrack not implemented");
    }

    /**
     * Removes the track with the corresponding track id. The function needs to throw an error with the message "No id provided" if no id was provided
     * and "Invalid id provided" if the id is not of type number.
     * @param trackId The id of the track to be removed.
     */
    removeTrack(trackId) {
        throw new Error("removeTrack not implemented");
    }



    async getTracksInfo(tracksId) {
        if (typeof (tracksId) == "number") tracksId = [tracksId];
        else if (typeof (tracksId) == "string") tracksId = [parseInt(tracksId)];
        return new Promise((resolve, reject) => {
            if (typeof (tracksId) != "object") reject("TrackIds must be of type array");

            var stmt = `SELECT tracks.id AS trackId, tracks.title, 
                tracks.trackNr, 
                tracks.diskNr, 
                tracks.year, 
                tracks.duration, 
                albums.id AS albumId, 
                albums.name AS albumName, 
                artists.id AS artistId, 
                artists.name AS artistName 
            FROM tracks 
            INNER JOIN albums ON tracks.albumId=albums.id
            INNER JOIN artists ON tracks.artistId=artists.id
            WHERE tracks.id IN `;

            var ids = "(?";

            for (var i = 1; i < tracksId.length; i++) {
                ids += ",?";
            }
            ids += ") ";

            stmt = stmt + ids + "ORDER BY albums.id, tracks.trackNr, tracks.diskNr";

            stmt = this.db.prepare(stmt);

            stmt.all(tracksId, (err, val) => {
                if (err) reject(err);
                resolve(val);
            });

            stmt.finalize();
        });
    }

    async getAllTracks(limit) {

    }


    /**
     * Adds a new artist with the corresponding infos in the database.
     * @param infos a JSON object with at least the following fields:
     *      name:   The name of the artist to be added.
     *      picturePath*:   The path of the artist's picture on the drive
     */
    async addNewArtist(infos) {
        return new Promise((resolve, reject) => {
            if (typeof (infos.name) == "undefined") throw new Error("Artist name not included");
            var stmt = this.db.prepare("INSERT INTO artists(name, picturePath) VALUES (?,?)");
            stmt.run(infos.name, typeof (infos.coverPath) == "undefined" ? null : infos.coverPath, err => {
                if (err) {
                    if (err.errno == 19) {
                        reject("Artist already exists");
                    }
                    else reject(err);
                }
                resolve();
            }).finalize();

        });


    }

    /**
     * Retrieves the artist informations from the database. The function needs to throw an error with the message "Invalid id provided"
     * if the id is not of type number.
     * @param criteria The search criteria, as a JSON object. The possible fields of the 
     * criteria are the same as the "infos" parameter in the "addNewArtist" method, in addition of 
     * an id field. 
     * 
     * @returns an array containing all the artists informations, in JSON
     */
    async getArtist(criteria, callback = null) {
        return new Promise(async (resolve, reject) => {
            var searchS = "SELECT * FROM artists WHERE ";
            var searchV = [];

            Object.keys(criteria).forEach(k => {
                searchS += searchV.length > 0 ? " AND " + k + "=?" : k + "=?";
                searchV.push(criteria[k]);
            });

            var stmt = this.db.prepare(searchS, (err) => {
                if (err != null) {
                    console.log("An error occured while getting the artists: ", err);
                    reject(err);
                }
            });

            var stmtP = stmt.get(searchV, (err, row) => {
                if (err != null) {
                    console.log("oui monsieur");
                    reject(err);
                }
                resolve(row);
            });
        })

    }

    async getArtistInfo(artistId){
        if(typeof(artistId) == "string") artistId = parseInt(artistId);
        return new Promise((resolve, reject) => {
            if (typeof (artistId) != "number") reject("artistId must be of type number");

            var stmt = `SELECT * FROM artists WHERE id=?`;

            stmt = this.db.prepare(stmt);

            stmt.get(artistId, (err, baseArtistInfo) => {
                if (err) reject(err);
                if(typeof(baseArtistInfo) == "undefined") {
                    resolve();
                    return;
                }
                
                stmt = `SELECT DISTINCT id FROM tracks WHERE artistId=? LIMIT 10`;
                stmt = this.db.prepare(stmt);

                stmt.all(artistId, (err, trackList) =>{
                    if(err) reject(err);
                    baseArtistInfo.tracks = trackList.map(track => track.id);;

                    stmt = `SELECT DISTINCT albumId FROM tracks WHERE artistId=? LIMIT 10`;
                    stmt = this.db.prepare(stmt);
                    stmt.all(artistId, (err, albumList)=>{
                        if(err) reject(err);

                        baseArtistInfo.albums = albumList.map(album => album.albumId);
                        resolve(baseArtistInfo);

                    }).finalize();
                }).finalize();
            }).finalize();
        });
    }

    /**
     * Retrieves all the artists from the database and execute the callback with one parameter being the array containing all the artists.
     * @param callback The function to be called with the array containing all the artsits.
     */
    getAllArtists(callback = null) {
        this.db.all("SELECT * FROM artists", (err, rows) => {
            if (callback != null) callback(rows);
            return rows;
        });
    }

    /**
     * Updates the artist with the provided information. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param infos A JSON object containing the information to be updated, in addition of a mandatory "id" field.
     */
    updateArtist(infos) {
        if (typeof (infos.id) == "undefined") throw new Error("Id not provided");
        if (typeof (infos.id) != "number") throw new Error("Invalid ID type");

        var updateS = "UPDATE artists SET ";
        var updateV = [];

        Object.keys(infos).forEach(k => {
            if (k == "id") return;
            updateS += updateV.length > 0 ? ", " + k + "=?" : k + "=?";
            updateV.push(infos[k]);
        });


        if (updateV.length == 0) throw new Error("Need one field to update");

        updateS += " WHERE id=?";
        updateV.push(infos.id);

        var stmt = this.db.prepare(updateS);
        stmt.run(updateV);
    }

    /**
     * Removes the artist from the database.The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number. Needs to throw an error with the message "Dependencies Still Present" if there are still songs and/or albums
     * with the corresponding artistId.
     * @param artistId The id of the artist to be removed from the database.
     * @param cascadeRemove A boolean value to determine if the method should also remove
     * songs and albums with the corresponding artist.
     */
    removeArtist(artistId, cascadeRemove = false) {
        this.db.serialize(() => {
            if (cascadeRemove) {
                this.db.prepare("DELETE FROM tracks WHERE artistId=?").run(artistId);
                this.db.prepare("DELETE FROM albums WHERE artistId=?").run(artistId);
            }
            this.db.prepare("DELETE FROM artists WHERE id=?").run(artistId);
        });
    }


    /**
     * Adds a new album in the database with the corresponding infos.
     * @param infos a JSON object containing the following fields:
     *      name:   The name of the album
     *      coverPath*: The path to the album cover image.
     *      artistId: The id of the artist whose album it is.
     * 
     *  Fields marked with * are not mandatory.
     */
    async addNewAlbum(infos) {
        return new Promise((resolve, reject) => {
            if (typeof (infos.name) == "undefined")
                reject("Album name not provided");
            if (typeof (infos.path) == "undefined")
                reject("Album path not provided");

            this.db.prepare("INSERT INTO albums(name, path, cover) VALUES (?,?, ?)")
                .run(infos.name, infos.path, typeof (infos.coverPath) == "undefined" ? null : infos.coverPath, (err) => {
                    if (err) reject(err);
                    resolve();
                });
        });
    }

    async getAlbumsInfo(albumIds) {
        if (typeof (albumIds) == "number") albumIds = [albumIds];
        else if (typeof (albumIds) == "string") albumIds = [parseInt(albumIds)];

        return new Promise((resolve, reject) => {
            var stmt = `select albums.id,
                albums.name as albumName,
                albums.cover,
                json_group_array(DISTINCT artists.name)as artistNames,
                json_group_array(DISTINCT artists.id) as artistIds
            from tracks 
            LEFT JOIN albums ON tracks.albumId=albums.id
            LEFT JOIN artists ON tracks.artistId=artists.id
            WHERE albums.id IN `

            var ids = "(?";

            for (var i = 1; i < albumIds.length; i++) {
                ids += ",?";
            }
            ids += ") ";
            stmt = stmt + ids + " GROUP BY albums.id";

            stmt = this.db.prepare(stmt);

            stmt.all(albumIds, (err, row) => {
                if (err) reject(err);
                resolve(row);
            })
                .finalize();

        });


    }

    /**
     * Retrieves the albums informations with the matching criteria. The function needs to throw an error with the message "Invalid id provided" 
     * if an id was provided but not of type number.
     * @param criteria The search criteria, as a JSON object. The possible fields of the 
     * criteria are the same as the "infos" parameter in the "addNewAlbum" method, in addition of 
     * an "id" field. 
     */
    async getAlbum(criteria) {
        return new Promise((resolve, reject) => {
            var searchS = "SELECT * FROM albums WHERE ";
            var searchV = [];

            Object.keys(criteria).forEach(k => {
                searchS += searchV.length > 0 ? " AND " + k + "=?" : k + "=?";
                searchV.push(criteria[k]);
            });

            try {
                var stmt = this.db.prepare(searchS, (err) => {
                    if (err != null) console.log("An error occured while getting the albums: ", err);
                });
                stmt.get(searchV, (err, row) => {
                    if (err) {
                        reject(err);
                    }
                    resolve(row);
                });
            }
            catch (e) {
                console.log(e);
            }
        });

    }

    async getAlbumDir(id) {
        return new Promise((resolve, reject) => {
            if (typeof (id) != "number") reject("Id is not of type number");

            this.db.prepare("select path from albums where id=?")
                .get(id, (err, val) => {
                    if (err) reject(err);
                    resolve(val.path);
                })
                .finalize();
        });
    }

    /**
     * Updates the information of the album. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param infos A JSON object containing the informations to be updated. The valid fields are the same as that  of the "addNewAlbum" method
     * in addition of a mandatory "id" field.
     */
    updateAlbum(infos) {
        if (typeof (infos.id) == "undefined") throw new Error("Id not provided");
        if (typeof (infos.id) != "number") throw new Error("Invalid ID type");

        var updateS = "UPDATE albums SET ";
        var updateV = [];

        Object.keys(infos).forEach(k => {
            if (k == "id") return;
            updateS += updateV.length > 0 ? ", " + k + "=?" : k + "=?";
            updateV.push(infos[k]);
        });

        if (updateV.length == 0) throw new Error("Need one field to update");

        updateS += " WHERE id=?";
        updateV.push(infos.id);

        var stmt = this.db.prepare(updateS);
        stmt.run(updateV);
    }

    /**
     * Removes the album from the database.The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param albumId The id of the album to be removed.
     * @param cascadeRemove A boolean value to determine if the method should also remove
     * songs with the corresponding album.
     */
    removeAlbum(albumId, cascadeRemove = false) {
        this.db.serialize(() => {
            if (cascadeRemove) this.db.prepare("DELETE FROM tracks WHERE albumId=?").run(albumId);
            this.db.prepare("DELETE FROM albums WHERE id=?").run(albumId);
        });

    }


    /**
     * Adds a user to the database
     * @param username The username of the user
     * @param password The password of the user, hashed in sha256
     * @param isAdmin An integer between 0 and 1 to tell the system whether the user is an admin or not. Admins are allowed to 
     * access the library management dashboard, as well as to create new users or not.
     */
    async addUser(username, password, isAdmin = 0) {
        this.db.prepare("INSERT INTO users(username, password, isAdmin) VALUES (?, ?, ?)")
            .run(username, password, isAdmin).finalize();
    }


    async updateUser(infos) {

    }

    removeUser(userId) {
        this.db.prepare("DELETE FROM users WHERE id=?").run(userId);
    }




    /**
     * A function for experimental developement that execute raw queries. The function needs to throw an error with the message "Not in experimental mode" if the
     * process.env.experimental variable is not set to true.
     * @param request The raw query to be executed.
     */
    executeRequest(request) {
        if (!process.env.EXPERIMENTAL) throw new Error("The application is not in experimental mode, cannot execute raw requests.");
        this.db.run(request);
    }
}

export default SqliteManager;