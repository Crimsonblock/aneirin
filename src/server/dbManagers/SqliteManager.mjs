import DbManager from "./DbManager.mjs";
import sqlite3 from "sqlite3";

// TODO add Tags, playlists and maybe tokens table.

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
            CREATE TABLE IF NOT EXISTS "albums"(\
                "id" INTEGER NOT NULL UNIQUE, \
                "name" TEXT NOT NULL, \
                "artistId" INTEGER NOT NULL UNIQUE, \
                "cover" TEXT, \
                PRIMARY KEY("id" AUTOINCREMENT), \
                CONSTRAINT "albumsArtistId" FOREIGN KEY("artistId") REFERENCES artists(id)\
            )');
            // Creates the tracks table
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "tracks" (\
                "id"	INTEGER NOT NULL UNIQUE,\
                "title"	TEXT NOT NULL,\
                "artistId"	INTEGER NOT NULL,\
                "albumId" INTEGER NOT NULL,\
                "composer" TEXT,\
                "trackNr" INTEGER,\
                "diskNr" INTEGER,\
                "year" INTEGER,\
                "path" TEXT NOT NULL, \
                PRIMARY KEY("id" AUTOINCREMENT),\
                CONSTRAINT "trackArtistId" FOREIGN KEY("artistId") REFERENCES artists(id)\
                CONSTRAINT "trackAlbumId" FOREIGN KEY("albumId") REFERENCES albums(id)\
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
    search(name) {
        throw new Error("search not implemented");
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
     *      mpdPathL:   The path to the lossy-encoded Media Presentation Descriptor file
     *      mpdPathH:   The path to the losslessly-encoded Media Presentation Descriptor file
     *      
     *  Fields marked by * are optionals.
     */
    addNewTrack(infos) {
        // Checks if all mandatory informations are provided
        if (typeof (infos.title) == "undefined") throw new Error("Title is required to add a new track");
        if (typeof (infos.artistId) == "undefined") throw new Error("Artist id is required to add a new track");
        if (typeof (infos.albumId) == "undefined") throw new Error("Album id is required to add a new track");
        if (typeof (infos.trackNr) == "undefined") throw new Error("Track number is required to add a new track");
        if (typeof (infos.genre) == "undefined") throw new Error("Genre is required to add a new track");
        if (typeof (infos.mpdPathL) == "undefined") throw new Error("Lossy encoded MPD path is required to add a new track");
        if (typeof (infos.mpdPathH) == "undefined") throw new Error("Lossless encoded MPD path is required to add a new track");


        var genresId = [];

        // Checks the type of the genres and adds the genre to the db if required
        if (typeof (infos.genre) == "string") {
            // Gets the id from the db
            this.db.prepare("SELECT id FROM genres WHERE name=?").get(infos.genre, (row => {

                // If the row does not exist
                if (typeof (row) == "undefined") {
                    // Execute those statements one after the other
                    this.db.serialize(() => {
                        // Inserts the genre in the genres table
                        this.db.prepare("INSERT INTO genres(name) VALUES(?)").run(infos.genre).finalize();
                        // Gets the id of the newly inserted genre
                        this.db.prepare("SELECT id FROM genres WHERE name=?").get(infos.genre, row2 => {
                            genresId.push(row2.id);
                        }).finalize();
                    });
                }
                else {
                    // Gets the id from the genres table and adds it to the genresId in the db
                    genresId.push(row.id);
                }

            })).finalize();

        }
        else if (typeof (infos.genre) == "object") {
            var stmt = this.db.prepare("SELECT id FROM genres WHERE name=?");
            infos.genre.forEach(genre => {
                stmt.get(genre, row => {
                    if (typeof (row) == "undefined") {
                        this.db.serialize(()=>{
                            this.db.prepare("INSERT INTO genres(name) VALUES(?)").run(genre).finalize();
                            stmt.get(genre, row2=>{
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
        else throw new Error("Genres must be a string or an array of strings");

        // Genres ids retrieval complete

        this.db.prepare("INSERT INTO title(title, artistid, albumId, composer, trackNr, diskNr, year, mpdPathL, mpdPathH) VALUES(?,?,?,?,?,?,?,?,?)")
        .run();

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
    getTracks(criteria) {
        throw new Error("getTrack not implemented");
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


    /**
     * Adds a new artist with the corresponding infos in the database.
     * @param infos a JSON object with at least the following fields:
     *      name:   The name of the artist to be added.
     *      picturePath*:   The path of the artist's picture on the drive
     */
    addNewArtist(infos) {
        if (typeof (infos.name) == "undefined") throw new Error("Artist name not included");
        var stmt = this.db.prepare("INSERT INTO artists(name, picturePath) VALUES (?,?)");
        stmt.run(infos.name, typeof (infos.coverPath) == "undefined" ? null : infos.coverPath).finalize();
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
        // Creates the base query string and sets the values.
        var searchS = "SELECT * FROM artists WHERE ";
        var searchV = [];

        // Constructs the WHERE clauses with the keys of the criteria object
        Object.keys(criteria).forEach(k => {
            searchS += searchV.length > 0 ? " AND " + k + "=?" : k + "=?";
            searchV.push(criteria[k]);
        });

        // Executes the statement and calls the callback with the new value.
        try {
            var stmt = this.db.prepare(searchS, (err) => {
                if (err != null) console.log("An error occured while getting the artists: ", err);
            });
            stmt.get(searchV, (err, row) => {
                if (callback != null) callback(row);
                if (err) console.log(err);
            });
        }
        catch (e) {
            console.log(e);
        }
    }

    /**
     * Retrieves all the artists from the database and execute the callback with one parameter being the array containing all the artists.
     * @param callback The function to be called with the array containing all the artsits.
     */
    getAllArtists(callback = null) {
        this.db.all("SELECT * FROM artists", rows => {
            if (callback != null) callback(rows);
        });
    }

    /**
     * Updates the artist with the provided information. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param infos A JSON object containing the information to be updated, in addition of a mandatory "id" field.
     */
    updateArtist(infos) {
        // Checks if the id field is provided and of corect type
        if (typeof (infos.id) == "undefined") throw new Error("Id not provided");
        if (typeof (infos.id) != "number") throw new Error("Invalid ID type");

        // Creates the base UPDATE clause.
        var updateS = "UPDATE artists SET ";
        var updateV = [];

        // Sets the new values based on the keys. The id key is ignored as it is used for the clause.
        Object.keys(infos).forEach(k => {
            if (k == "id") return;
            updateS += updateV.length > 0 ? ", " + k + "=?" : k + "=?";
            updateV.push(infos[k]);
        });

        // Checks if any field was provided
        if (updateV.length == 0) throw new Error("Need one field to update");

        // Creates the WHERE clause for the update and executes the statement
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
    addNewAlbum(infos) {
        // Checks if the required fields were provided
        if (typeof (infos.artistId) == "undefined")
            throw new Error("Artist id not provided");
        if (typeof (infos.name) == "undefined")
            throw new Error("Album name not provided");

        // Prepares the statement and executes it with the correct values
        stmt.prepare("INSERT INTO albums(name, artistId, cover) VALUES (?,?,?)")
            .run(infos.name, infos.artistId, typeof (infos.coverPath) == "undefined" ? null : infos.coverPath);
    }

    /**
     * Retrieves the albums informations with the matching criteria. The function needs to throw an error with the message "Invalid id provided" 
     * if an id was provided but not of type number.
     * @param criteria The search criteria, as a JSON object. The possible fields of the 
     * criteria are the same as the "infos" parameter in the "addNewAlbum" method, in addition of 
     * an "id" field. 
     */
    getAlbum(criteria) {
        // Creates the base query string and sets the values.
        var searchS = "SELECT * FROM albums WHERE ";
        var searchV = [];

        // Constructs the WHERE clauses with the keys of the criteria object
        Object.keys(criteria).forEach(k => {
            searchS += searchV.length > 0 ? " AND " + k + "=?" : k + "=?";
            searchV.push(criteria[k]);
        });

        // Executes the statement and calls the callback with the new value.
        try {
            var stmt = this.db.prepare(searchS, (err) => {
                if (err != null) console.log("An error occured while getting the albums: ", err);
            });
            stmt.get(searchV, (err, row) => {
                if (callback != null) callback(row);
                if (err) console.log(err);
            });
        }
        catch (e) {
            console.log(e);
        }
    }

    /**
     * Updates the information of the album. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type number.
     * @param infos A JSON object containing the informations to be updated. The valid fields are the same as that  of the "addNewAlbum" method
     * in addition of a mandatory "id" field.
     */
    updateAlbum(infos) {
        // Checks if the id field is provided and of corect type
        if (typeof (infos.id) == "undefined") throw new Error("Id not provided");
        if (typeof (infos.id) != "number") throw new Error("Invalid ID type");

        // Creates the base UPDATE clause.
        var updateS = "UPDATE albums SET ";
        var updateV = [];

        // Sets the new values based on the keys. The id key is ignored as it is used for the clause.
        Object.keys(infos).forEach(k => {
            if (k == "id") return;
            updateS += updateV.length > 0 ? ", " + k + "=?" : k + "=?";
            updateV.push(infos[k]);
        });

        // Checks if any field was provided
        if (updateV.length == 0) throw new Error("Need one field to update");

        // Creates the WHERE clause for the update and executes the statement
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