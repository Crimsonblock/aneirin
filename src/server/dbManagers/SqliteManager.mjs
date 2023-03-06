import DbManager from "./DbManager.mjs";
import sqlite3 from "sqlite3";

// TODO add Tags, playlists and maybe tokens table.

class SqliteManager extends DbManager{
    constructor(){
        super();
        this.db = null;
    }

    /**
     * Connects to the db and stores the relevant information inside the object
     * @param credentials An object containing a "file" key that indicates the path to the db file.
     */
    connect(credentials){
        if(typeof(credentials.file) == "undefined") throw new Error("No file provided");
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
    install(){
        if(this.db == null) throw new Error("DB not yet connected");
        this.db.serialize(()=>{
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
                "mpdPathH" TEXT NOT NULL, \
                "mpdPathL" TEXT NOT NULL, \
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
            this.db.run('\
            CREATE TABLE IF NOT EXISTS "trackGenres"(\
                "id" INTEGER NOT NULL UNIQUE,\
                "trackId" INTEGER NOT NULL,\
                "genreId" INTEGER NOT NULL,\
                PRIMARY KEY("id" AUTOINCREMENT),\
                CONSTRAINT "trackGenresTrackId" FOREIGN KEY("trackId") REFERENCES tracks("id"),\
                CONSTRAINT "trackGenresGenreId" FOREIGN KEY("genreId") REFERENCES genres("id")\
            )')

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
    search(name){
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
     *      
     *  Fields marked by * are optionals.
     */
    addNewTrack(infos){
        throw new Error("addNewTrack not implemented");
    }
    
    /**
     * Gets informations about tracks that match the provided search criteria. The function needs to throw an error with the message "Invalid id provided"
     * or if the id is not of type int.
     * @param criteria A JSON object containing the search criteria. Valid fields are 
     * the same as the "infos" object in the "addNewTrack" method, in addition with an "id" field,
     * corresponding to the track id.
     * 
     * @returns an array containing all the tracks matching the search criteria.
     */
    getTracks(criteria){
        throw new Error("getTrack not implemented");
    }

    /**
     * Updates a track with the provided information. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int.
     * @param infos A JSON object containing the informations to be updated. The fields of the JSON object
     * are the same as the "infos" field in the "addNewTrack" method, in addition with a mandatory "id" field.
     */
    updateTrack(infos){
        throw new Error("updateTrack not implemented");
    }

    /**
     * Removes the track with the corresponding track id. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int.
     * @param trackId The id of the track to be removed.
     */
    removeTrack(trackId){
        throw new Error("removeTrack not implemented");
    }


    /**
     * Adds a new artist with the corresponding infos in the database.
     * @param infos a JSON object with at least the following fields:
     *      name:   The name of the artist to be added.
     *      picturePath*:   The path of the artist's picture on the drive
     */
    addNewArtist(infos){
        throw new Error("addNewArtist not implemented");
    }

    /**
     * Retrieves the artist informations from the database. The function needs to throw an error with the message "Invalid id provided"
     * if the id is not of type int.
     * @param criteria The search criteria, as a JSON object. The possible fields of the 
     * criteria are the same as the "infos" parameter in the "addNewArtist" method, in addition of 
     * an id field. 
     * 
     * @returns an array containing all the artists informations, in JSON
     */
    getArtist(criteria){
        throw new Error("getArtist not implemented");
    }

    /**
     * Updates the artist with the provided information. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int.
     * @param infos A JSON object containing the information to be updated, in addition of a mandatory "id" field.
     */
    updateArtist(infos){
        throw new Error("updateArtist not implemented");
    }
    
    /**
     * Removes the artist from the database.The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int. Needs to throw an error with the message "Dependencies Still Present" if there are still songs and/or albums
     * with the corresponding artistId.
     * @param artistId The id of the artist to be removed from the database.
     * @param cascadeRemove A boolean value to determine if the method should also remove
     * songs and albums with the corresponding artist.
     */
    removeArtist(artistId, cascadeRemove=false){
        throw new Error("removeArtist not implemented");
    }


    /**
     * Adds a new album in the database with the corresponding infos.
     * @param infos a JSON object containing the following fields:
     *      name:   The name of the album
     *      artistId:   The id of the artist who made the album.
     *      cover*: The path to the album cover image.
     * 
     *  Fields marked with * are not mandatory.
     */
    addNewAlbum(infos){
        throw new Error("addNewAlbum not implemented");
    }

    /**
     * Retrieves the albums informations with the matching criteria. The function needs to throw an error with the message "Invalid id provided" 
     * if an id was provided but not of type int.
     * @param criteria The search criteria, as a JSON object. The possible fields of the 
     * criteria are the same as the "infos" parameter in the "addNewAlbum" method, in addition of 
     * an "id" field. 
     */
    getAlbum(criteria){
        throw new Error("getAlbum not implemented");
    }

    /**
     * Updates the information of the album. The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int.
     * @param infos A JSON object containing the informations to be updated. The valid fields are the same as that  of the "addNewAlbum" method
     * in addition of a mandatory "id" field.
     */
    updateAlbum(infos){
        throw new Error("updateAlbum not implemented");
    }
    
    /**
     * Removes the album from the database.The function needs to throw an error with the message "Invalid id provided" if no id was provided
     * or if the id is not of type int.
     * @param albumId The id of the album to be removed.
     * @param cascadeRemove A boolean value to determine if the method should also remove
     * songs with the corresponding album.
     */
    removeAlbum(albumId, cascadeRemove=false){
        throw new Error("removeAlbum not implemented");
    }


    async addUser(username, password, isAdmin=0){
        var stmt = await this.db.prepare("INSERT INTO users(username, password, isAdmin) VALUES (?, ?, ?)");
        stmt.run(username, password, isAdmin).finalize(); 
    }

    async updateUser(infos){

    }

    removeUser(username){
        throw new Error("removeUser not implemented");
    }

    /**
     * A function for experimental developement that execute raw queries. The function needs to throw an error with the message "Not in experimental mode" if the
     * process.env.experimental variable is not set to true.
     * @param request The raw query to be executed.
     */
    executeRequest(request){
        if(!process.env.EXPERIMENTAL) throw new Error("The application is not in experimental mode, cannot execute raw requests");
        this.db.run(request);
    }
}

export default SqliteManager;