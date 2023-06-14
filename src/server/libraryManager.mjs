import { mkdirSync, readdirSync, rmSync, writeFileSync } from "fs";
import { parseFile } from "music-metadata";
import path from "path";
import log, { LOG_LEVEL } from "./utils.mjs";
import { execSync } from "child_process";



class LibraryManager {
    constructor(config, resources) {
        this.config = config;
        this.resources = resources;
    }



    async processDataDirectory() {
        if (this.config.transcoding) return;

        this.config.transcoding = true;
        var files = readdirSync(path.join(this.config.data_dir, "/toBeProcessed"));

        for (var i = 0; i < files.length; i++) {
            log(LOG_LEVEL.INFO, "Processing file " + (i + 1) + " of " + files.length);
            var file = path.join(this.config.data_dir, "/toBeProcessed", files[i]);
            log(LOG_LEVEL.DEBUG, "Scanning file " + file);

            /* This check is required, because in testing, the same file was treated twice, which
            shouldn't occur since it is in the structure loops over all the file one at a time */
            try {
                var metadata = await parseFile(file);
            }
            catch (e) {
                if (e.message.includes("no such")) {
                    log(LOG_LEVEL.DEBUG_WARN, "Prevented file to be processed several times");
                    continue;
                }
                else {
                    log(LOG_LEVEL.ERROR, "An error occurred while retrieving metadata of file " + file + ":");
                    log(LOG_LEVEL.ERROR, e, this.config);
                    break;
                }
            }

            var albumArtist = null;
            if (typeof (metadata.common.albumartist) == "undefined") {
                albumArtist = metadata.common.artist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, "");
            }
            else {
                albumArtist = metadata.common.albumartist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, "");
            }


            albumArtist = await this.getArtistCreateIfNotExists(albumArtist);
            

            var albumInfos = { name: metadata.common.album }

            var album = await this.resources.db.getAlbum(albumInfos);
            if (typeof (album) == "undefined") {
                var albumDir = path.join("/library/", albumArtist.name, "/", metadata.common.album);

                // If the track's file contains the cover picture of the album, retrieves it and writes it to a file in the album folder.
                for (var i in metadata.common.picture) {
                    if (typeof (metadata.common.picture[i].type) != "undefined" && metadata.common.picture[i].type.toLowerCase().includes("cover")) {
                        mkdirSync(albumDir, { recursive: true });
                        if (metadata.common.picture[i].format.includes("jpeg")) {
                            writeFileSync(path.join(albumDir, "cover.jpg"), metadata.common.picture[i].data);
                            albumInfos.coverPath = path.join(albumDir, "cover.jpg");
                        }
                        else {
                            log(LOG_LEVEL.WARN, "The format is of type " + metadata.common.picture[i].format + ", considering png");
                            writeFileSync(path.join(albumDir, "cover.png"), metadata.common.picture[i].data);
                            albumInfos.coverPath = path.join(albumDir, "cover.png");
                        }
                        break;
                    }
                }

                
                albumInfos.path = albumDir;

                await this.resources.db.addNewAlbum(albumInfos);
                delete albumInfos.coverPath;
                album = await this.resources.db.getAlbum(albumInfos);
            }


            var artist = metadata.common.artist.split(",")[0].split("/")[0].replace(/[ \t]+$/i, ""); //  <- This regex removes the trailing whitespaces/tab
            artist = await this.getArtistCreateIfNotExists(artist);

            var trackInfos = {
                title: metadata.common.title,
                artistId: artist.id,
                albumId: album.id,
                trackNr: metadata.common.track.no,
                diskNr: metadata.common.disk.no,
                year: metadata.common.year,
                genre: metadata.common.genre[0],
                duration: Math.round(metadata.format.duration)
            };


            await this.resources.db.addNewTrack(trackInfos).catch(e => {
                if (e.errno == 19) {
                    log(LOG_LEVEL.WARN, "The track " + trackInfos.title + " already exists, it will be updated");
                }
                else {
                    log(LOG_LEVEL.ERROR, "An error occurred while adding new track");
                    log(LOG_LEVEL.ERROR, e, this.config);
                    return;
                }
            });


            log(LOG_LEVEL.DEBUG, "Track " + trackInfos.title + " added to the db");

            delete trackInfos.genre;
            delete trackInfos.path;
            delete trackInfos.diskNr;

            var track = await this.resources.db.getTracks(trackInfos).catch(e => {
                log(LOG_LEVEL.ERROR, "An error occurred while retrieving the new track");
                log(LOG_LEVEL.ERROR, e, this.config);
            });

            if (typeof (track) == "undefined") {
                log(LOG_LEVEL.ERROR, "An Unable to retrieve the newly added track " + trackInfos.title);
                log(LOG_LEVEL.DEBUG_WARN, "The track is undefined");
                log(LOG_LEVEL.DEBUG_WARN, trackInfos, this.config);
                return;
            }


            log(LOG_LEVEL.DEBUG, "Starting transcoding file " + file);
            this.transcodeFile(file, track.title, path.join(this.config.data_dir, album.path.replace(/:/g, "-"), "/", metadata.common.title.replace(/\//g, "_")), metadata.format.container);
            log(LOG_LEVEL.DEBUG, "File transcoding completed");

            log(LOG_LEVEL.DEBUG, "Removing unnecessary files");
            rmSync(file);
            log(LOG_LEVEL.DEBUG, "File processing done");
        }

        delete this.config.transcoding;

    }

    async getArtistCreateIfNotExists(name) {
        var artist = await this.resources.db.getArtist({ name: name }).catch(e => log(LOG_LEVEL.ERRORR, "An error occurred while retrieving an artist from the database: " + e));
        if (typeof (artist) == "undefined") {
            this.resources.db.addNewArtist({ name: name }).catch(console.log);
            artist = await this.resources.db.getArtist({ name: name }).catch(e => log(LOG_LEVEL.ERRORR, "An error occurred while adding an artist to the database: " + e));
        }
        return artist;
    }



    transcodeFile(file, title, dir, container) {
        log(LOG_LEVEL.DEBUG, dir);
        mkdirSync(dir, { recursive: true });

        var cmd = "cd " + LibraryManager.cleanString(dir) + " && ffmpeg -loglevel quiet -i " + file + " -strict -2 -f dash -dash_segment_type mp4"


        const LOSSLESS = container.toLowerCase().includes("flac") || container.toLowerCase().includes("alac") || container.toLowerCase().includes("wave");

        // The file is not transcoded in lossless if it is not native or lossless to prevent useless waste of space
        for (var i in this.config.codecs) {
            if (!LOSSLESS && (this.config.codecs[i].includes("flac") || this.config.codecs.includes("alac"))) {
                log(LOG_LEVEL.WARN, "Tried to transcode a non lossless file to a lossless format. This would result in a waste of space. Skipping.");
                continue;
            }
            cmd += " -map 0:a:0 " + this.config.codecs[i];
        }

        cmd += " " + LibraryManager.cleanString(title, false) + ".mpd";

        execSync(cmd);

    }


    static cleanString(str, isDir = true) {
        str = str.replace(/'/g, "\\'")
            .replace(/ /g, "\\ ")
            .replace(/\)/g, "\\)")
            .replace(/\(/g, "\\(")
            .replace(/&/g, "\\&");
        if (!isDir) str = str.replace(/\//g, "_");
        return str;
    }


}




export default LibraryManager;