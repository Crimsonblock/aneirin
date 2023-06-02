import { readdirSync } from "fs";
import { parseFile } from "music-metadata";
import path from "path";


class LibraryManager {
    constructor(config, resources) {
        this.config = config;
        this.resources = resources;
    }



    // Scans the music directory
    async scanDataDirectory() {
        var files = readdirSync(path.join(this.config.data_dir, "/toBeProcessed"));

        for (var i=0; i<files.length; i++){
            var metadata = await parseFile(path.join(this.config.data_dir, "/toBeProcessed", files[i]));
            
            // Gets the first album artist and removes the trailing whitespace/tab
            var albumArtist = metadata.common.albumartist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, "");
            albumArtist = await this.getArtistCreateIfNotExists(albumArtist);
            
            // TODO: extract album cover details before inserting
            var albumDir = path.join(this.config.data_dir, "/library/", albumArtist.name, "/", album.name);


            // Tries to get the album, and creates it if it does not exist
            var album = await this.resources.db.getAlbum({name: metadata.common.album, artistId: albumArtist.id});
            if(typeof(album)=="undefined"){
                await this.resources.db.addNewAlbum({name: metadata.common.album, artistId: albumArtist.id});
                album = await this.resources.db.getAlbum({name: metadata.common.album, artistId: albumArtist.id});
            }
            
            // Gets the first track artist and removes the trailing whitespaces/tab
            var artist = metadata.common.artist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, "");
            artist = await this.getArtistCreateIfNotExists(artist);

            await this.resources.db.addNewTrack({
                title: metadata.common.title,
                artistId: artist.id,
                albumId: album.id,
                trackNr: metadata.common.track.no,
                diskNr: metadata.common.disk.no,
                year: metadata.common.year,
                genre: metadata.common.genre[0],
                path: path.join(albumDir, "/", album.name)
            }).catch(console.log);

            console.log("Track added to the db");
        }



    }

    async getArtistCreateIfNotExists(name) {
        var artist = await this.resources.db.getArtist({name: name}).catch(e=>console.log("An error occured: ", e));
        if(typeof(artist) == "undefined"){
            this.resources.db.addNewArtist({name: name}).catch(console.log);
            artist = await this.resources.db.getArtist({name: name}).catch(e=>console.log("An error occured: ", e));
        }       
        return artist;
    }


}




export default LibraryManager;