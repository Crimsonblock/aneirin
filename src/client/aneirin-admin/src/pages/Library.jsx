import { useRef, useState } from "react";
import "../styles/library.css"
import Modal from "../components/Modal";
import * as mmb from "music-metadata-browser";

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;


// This variable is used to be able to use the development server.
const BASE_URL = "http://localhost:8080";


export default function Library(props) {
    const [dragged, setDragged] = useState(false);
    const [filesState, setFiles] = useState([]);
    const [tracksState, setTracks] = useState({});
    const [uploading, setUploading] = useState(false);



    const modalRef = useRef(null);
    const showModal = () => {
        modalRef.current.show();
    }

    /**
     * Recursive function to scan the other folders/files in the subfolders.
     * This is needed to further retrieve files informations, as the provided files are nowin the form of 
     * FileSystemEntry and not File anymore. It could have been possible to use only one function for both stages, but 
     * this way makes it faster, as less conversions are needed, and we are able to get the files in a synchronous way.
    */
    const getFilesFromUnscannedEntries = (entries, alreadyRegisteredFiles = null, alreadyRegisteredTracks = null) => {
        if (entries.length === 0) return;
        const stateFiles = alreadyRegisteredFiles == null ? [...filesState] : alreadyRegisteredFiles;

        var fileEntries = entries.filter(entry => entry.isFile);
        var filesAdded = 0;

        var additionDone = false;
        var scanningDone = false;

        var files = [];
        fileEntries.forEach(entry => {
            entry.file(file => {
                files.push(file);
                filesAdded += 1;
            });
        });


        /*For some reason, it is required to set those functions to set the various variables,
        as when accessing it within the scanInterval, otherwise they are undefined.*/
        const getFiles = () => {
            return files;
        }
        const setF = (f) => {
            files = f;
        }

        const getMetadata = async (file) => {
            return mmb.parseBlob(file);
        }

        var tracks = alreadyRegisteredTracks == null ? { ...tracksState } : alreadyRegisteredTracks;
        const setFileMetadata = (index, metadata) => {
            /*Here we copy the tracks object rather than modifying it so the setTracks sees a new object
            and not the one currently in state. This results in React re-rendering the component. 
            Reusing the same object would be more memory efficient, but update would not be shown live*/
            var t = { ...tracks }
            t[files[index].webkitRelativePath + files[index].name] = metadata;
            tracks = t;
            setTracks(t);
        }

        var filesScanned = 0;
        var scanning = false;


        /* Using the interval instead of a for loop is required since retrieving a file from an entry must be asynchronous
        and this part requires the files retrieval to be complete. There is probably a better way to do it and will further be investigated.
        
        The FileSystemFileEntry file does not return a promise but takes one or two callbacks as parameters[1]. Because of that,
        using the interval is a solution to prevent having an exponential number of function calls as the files are processed.
        
        [1] https://developer.mozilla.org/en-US/docs/Web/API/FileSystemFileEntry*/
        var scanInterval = setInterval(async () => {
            var files = getFiles();

            if (additionDone && filesScanned < getFiles().length && !scanning) {
                scanning = true;

                try {
                    var metadata = await getMetadata(files[filesScanned]);
                    setFileMetadata(filesScanned, metadata);
                    filesScanned += 1;
                }
                catch {
                    console.log("The file " + files[filesScanned].name + " does not appear to be a music file and will be removed from the list");
                    files = files.filter(el => el !== files[filesScanned]);
                    setF(files);
                    setFiles(stateFiles.concat(files));
                }
                scanning = false;
            }

            else if (!additionDone && typeof (files) !== "undefined" && filesAdded >= fileEntries.length) {
                files = stateFiles.concat(files);
                additionDone = true;
                setFiles(files);
            }

            else if (filesScanned >= files.length) {
                scanningDone = true;
                clearInterval(scanInterval);
            }
        }, 100);


        var directoryReaders = entries.filter(entry => entry.isDirectory).map(entry => entry.createReader());
        var scannedFolders = 0;
        var unscannedEntries = [];

        
        directoryReaders.forEach(reader => {
            reader.readEntries(entries => {
                entries.forEach(entry => {
                    unscannedEntries.push(entry);
                })
                scannedFolders += 1;
            })
        });

        /*An interval is used to wait for the processes to be finished again. It is more important here,
        as it prevents the function to be called an exponential amount of time. The thought behind it was
        that calling the function less often with more data instead of once per directory can prevent a stack overflow
        when someone with a big music library drops the whole library at once*/
        var folderInterval = setInterval(() => {
            if (scannedFolders >= directoryReaders.length && additionDone && scanningDone) {
                clearInterval(folderInterval);
                if (unscannedEntries.length > 0)
                    console.log(files);
                getFilesFromUnscannedEntries(unscannedEntries, stateFiles.concat(files), tracks);
            }
        }, 500);


    };

    const dropHandler = (event) => {

        var dataEntries = [...event.dataTransfer.items].map(e => e.webkitGetAsEntry());

        // Gets the files handle to later send them to the server 
        getFilesFromUnscannedEntries(dataEntries);

        event.preventDefault();
        setDragged(false);

        return;
    }



    const confirmHandler = async () => {
        const CHUNK_SIZE = 1000000;
        setUploading(true);

        for (var i = 0; i < filesState.length; i++) {
            var buffer = await filesState[i].arrayBuffer();
            var response = await fetch(process.env.NODE_ENV == "development" ? "http://localhost:8080/api/v1/files/create/" + buffer.byteLength : "/api/v1/create/" + buffer.byteLength, { mode: "cors", method: "POST" })
            var fileId = await response.text();

            var numIter = Math.ceil(buffer.byteLength / CHUNK_SIZE);

            for (var j = 0; j <= numIter; j++) {
                var tState = { ...tracksState };
                tState[filesState[i].webkitRelativePath + filesState[i].name].progress = Math.round(j / numIter * 10000) / 100;
                setTracks(tState);
                
                var reqUrl = process.env.NODE_ENV == "development" ? "http://localhost:8080/api/v1/files/add/" : "/api/v1/files/add/";

                response = await fetch(reqUrl + fileId + "/" + j * CHUNK_SIZE, {
                    headers: {
                        "Content-Type": "application/octet-stream"
                    },
                    mode: "cors",
                    method: "POST",
                    body: buffer.slice(j * CHUNK_SIZE, (j + 1) * CHUNK_SIZE)
                });


                if (!response.ok) {
                    setUploading(false);
                    return;
                }
            }

            console.log("file successfully uploaded");
            response = await fetch(process.env.NODE_ENV == "development" ? "http://localhost:8080/api/v1/files/close/" + fileId : "/api/v1/files/close/" + fileId, { method: "POST" });
        }

        setUploading(false);
    }

    const cancelHandler = () => {
        setFiles([]);
        setTracks({});
    }


    return (
        <>
            <div className="library">
                <div className="card">
                    <h1 className="card-title">Library</h1>
                    <p>
                        Results to show: &nbsp;
                        <select name="option" id="">
                            <option value="20">20</option>
                        </select>
                    </p>

                    <input type="text" id="searchLibrary" placeholder="Search" />
                    <button className="btn circle" id="addTrack" onClick={showModal}><span>+</span></button>
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Album</th>
                                <th>Artist</th>
                                <th>Composer</th>
                                <th>Track Nr</th>
                                <th>Disk Nr</th>
                                <th>Year</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Brother Run Fast</td>
                                <td>Surface Sounds</td>
                                <td>Kaleo</td>
                                <td>-</td>
                                <td>1</td>
                                <td>1</td>
                                <td>2020</td>
                            </tr>
                            <tr>
                                <td>Eraser</td>
                                <td>%</td>
                                <td>Ed Sheeran</td>
                                <td>-</td>
                                <td>1</td>
                                <td>1</td>
                                <td>2016</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal title="Track upload" confirm="Upload" disableConfirm={uploading} disableCancel={uploading} confirmHandler={confirmHandler} cancelHandler={cancelHandler} cancel="Cancel" ref={modalRef}>
                <div className={filesState.length === 0 ? "dragNDropZone" : ""}
                    onDragOver={(event) => { event.preventDefault(); setDragged(true); }}
                    onDragExit={(event) => { event.preventDefault(); setDragged(false); }}
                    onDrop={(event) => { dropHandler(event) }}
                >

                    {dragged ? <p>Release to upload</p> : filesState.length === 0 ? <p>Drag one or more files here to upload</p> : ""}
                    {
                        filesState.length === 0 ? "" :
                            <>
                                <div id="filesSummary">
                                    <table>
                                        <thead>
                                            <tr>
                                                <td>File name</td>
                                                <td>Title</td>
                                                <td>Artist</td>
                                                <td>Album</td>
                                                <td>Size (MB)</td>
                                                {uploading ? <td>Upload Progress</td> : ""}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filesState.map(file =>
                                                <tr key={file.webkitRelativePath + file.name}>
                                                    <td>{file.name}</td>
                                                    <td>
                                                        {typeof (tracksState[file.webkitRelativePath + file.name]) === "undefined" ? "" :
                                                            tracksState[file.webkitRelativePath + file.name].common.title}
                                                    </td>
                                                    <td>
                                                        {typeof (tracksState[file.webkitRelativePath + file.name]) === "undefined" ? "" :
                                                            tracksState[file.webkitRelativePath + file.name].common.artist}
                                                    </td>
                                                    <td>
                                                        {typeof (tracksState[file.webkitRelativePath + file.name]) === "undefined" ? "" :
                                                            tracksState[file.webkitRelativePath + file.name].common.album}
                                                    </td>
                                                    <td>{Math.round(file.size * 100 / (1024 ** 2)) / 100}</td>
                                                    {uploading
                                                        ?
                                                        typeof (tracksState[file.webkitRelativePath + file.name]) != "undefined" ?
                                                            typeof (tracksState[file.webkitRelativePath + file.name].progress) == "undefined" ?
                                                                <td>
                                                                    <div style={{ width: "10vw", height: "1rem", position: "relative", overflow: "hidden", borderRadius: "1rem", textAlign: "center" }}>
                                                                        <div style={{ backgroundColor: "green", width: "0%", height: "100%", position: "relative" }}>

                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                : <td>
                                                                    <div>
                                                                        <div style={{ width: "10vw", height: "1rem", position: "relative", overflow: "hidden", borderRadius: "1rem", textAlign: "center" }}>
                                                                            <div style={{ backgroundColor: "green", width: tracksState[file.webkitRelativePath + file.name].progress + "%", height: "100%", position: "relative" }}>

                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            : ""
                                                        : ""}
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <br />
                                <p>Total to be uploaded: {filesState.length} tracks</p>
                            </>
                    }

                </div>
            </Modal>
        </>
    );
}