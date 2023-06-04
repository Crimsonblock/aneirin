import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { parseFile } from "music-metadata";
import path from "path";
import { LOG_LEVEL, log } from "./utils.mjs";
import { execSync } from "child_process";


class LibraryManager {
    constructor(config, resources) {
        this.config = config;
        this.resources = resources;
    }



    async processDataDirectory() {
        var files = readdirSync(path.join(this.config.data_dir, "/toBeProcessed"));

        for (var i=0; i<files.length; i++){        
            log(LOG_LEVEL.INFO, "Scanning file "+i+" of "+files.length, this.config);
            var file = path.join(this.config.data_dir, "/toBeProcessed", files[i]);
            log(LOG_LEVEL.DEBUG, "Scanning file " + file, this.config);

            /* This check is required, because in testing, the same file was treated twice, which
            shouldn't occur since it is in the structure loops over all the file one at a time */
            try {
                var metadata = await parseFile(file);
            }
            catch(e){
                if(e.message.includes("no such")){
                    log(LOG_LEVEL.DEBUG_WARN, "Prevented file to be processed several times", this.config);
                    continue;
                }
                else{
                    log(LOG_LEVEL.ERROR, "An error occurred while retrieving metadata of file "+file+":", this.config);
                    log(LOG_LEVEL.ERROR, e, this.config);
                    break;
                }
            }
           
            var albumArtist = metadata.common.albumartist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, "");
            albumArtist = await this.getArtistCreateIfNotExists(albumArtist);
            var albumDir = path.join(this.config.data_dir, "/library/", albumArtist.name, "/", metadata.common.album);
           
            var album = await this.resources.db.getAlbum({ name: metadata.common.album, artistId: albumArtist.id });
            if (typeof (album) == "undefined") {

                // If the track's file contains the cover picture of the album, retrieves it and writes it to a file in the album folder.
                for(var i in metadata.common.picture){
                    if(typeof(metadata.common.picture[i].type) != "undefined" && metadata.common.picture[i].type.toLowerCase().includes("cover")){
                        mkdirSync(albumDir, {recursive:true});
                        if(metadata.common.picture[i].format.includes("jpeg")){
                            writeFileSync(path.join(albumDir, "cover.jpg"), metadata.common.picture[i].data);
                        }
                        else{
                            log(LOG_LEVEL.WARN, "The format is of type "+metadata.common.picture[i].format+", considering png", this.config);
                            writeFileSync(path.join(albumDir, "cover.png"), metadata.common.picture[i].data);
                        }
                        break;
                    }
                }

                await this.resources.db.addNewAlbum({ name: metadata.common.album, artistId: albumArtist.id });
                album = await this.resources.db.getAlbum({ name: metadata.common.album, artistId: albumArtist.id });
            }

            
            var artist = metadata.common.artist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, ""); //  <- This regex removes the trailing whitespaces/tab
            artist = await this.getArtistCreateIfNotExists(artist);

            var trackDir = path.join(albumDir.replace(/:/g, "-"), "/", metadata.common.title);
            var trackInfos = {
                title: metadata.common.title,
                artistId: artist.id,
                albumId: album.id,
                trackNr: metadata.common.track.no,
                diskNr: metadata.common.disk.no,
                year: metadata.common.year,
                genre: metadata.common.genre[0],
                path: trackDir
            };

           
            await this.resources.db.addNewTrack(trackInfos).catch(e => {
                if (e.errno == 19) {
                    log(LOG_LEVEL.WARN, "The track " + trackInfos.title + " already exists, it will be updated", this.config);
                }
                else {
                    log(LOG_LEVEL.ERROR, "An error occurred while adding new track", this.config);
                    log(LOG_LEVEL.ERROR, e, this.config);
                }
            });


            log(LOG_LEVEL.DEBUG, "Track " + trackInfos.title + " added to the db", this.config);

            delete trackInfos.genre;
            var track = await this.resources.db.getTracks(trackInfos).catch(e => {
                log(LOG_LEVEL.ERROR, "An error occurred while retrieving the new track", this.config);
                log(LOG_LEVEL.ERROR, e, this.config);
            });


            log(LOG_LEVEL.DEBUG, "Starting transcoding file " + file, this.config);
            this.transcodeFile(file, track.title, trackDir, metadata.format.container);
            log(LOG_LEVEL.DEBUG, "File transcoding completed", this.config);

            log(LOG_LEVEL.DEBUG, "Removing unnecessary files", this.config);
            rmSync(file);
            log(LOG_LEVEL.DEBUG, "File processing done", this.config);
        }



    }

    async getArtistCreateIfNotExists(name) {
        var artist = await this.resources.db.getArtist({ name: name }).catch(e => log(LOG_LEVEL.ERRORR, "An error occurred while retrieving an artist from the database: "+e, this.config) );
        if (typeof (artist) == "undefined") {
            this.resources.db.addNewArtist({ name: name }).catch(console.log);
            artist = await this.resources.db.getArtist({ name: name }).catch(e => log(LOG_LEVEL.ERRORR, "An error occurred while adding an artist to the database: "+e, this.config));
        }
        return artist;
    }



    transcodeFile(file, title, dir, container) {
        mkdirSync(dir, { recursive: true });

        var cmd = "cd " + this.cleanString(dir) + " && ffmpeg -loglevel quiet -i " + file + " -strict -2 -f dash -dash_segment_type mp4"

        
        const LOSSLESS = container.toLowerCase().includes("flac") || container.toLowerCase().includes("alac") || container.toLowerCase().includes("wave");

        // The file is not transcoded in lossless if it is not native or lossless to prevent useless waste of space
        for (var i in this.config.codecs) {
            if (!LOSSLESS && (this.config.codecs[i].includes("flac") || this.config.codecs.includes("alac"))) {
                log(LOG_LEVEL.WARN, "Tried to transcode a non lossless file to a lossless format. This would result in a waste of space. Skipping.", this.config);
                continue;
            }
            cmd += " -map 0:a:0 " + this.config.codecs[i];
        }

        cmd += " " + this.cleanString(title, false) + ".mpd"
        execSync(cmd);

    }


    cleanString(str, isDir = true) {
        str = str.replace(/'/g, "\\'")
            .replace(/ /g, "\\ ")
            .replace(/\)/g, "\\)")
            .replace(/\(/g, "\\(");
        if (!isDir) str = str.replace(/\//g, "_");
        return str;
    }


}




export default LibraryManager;