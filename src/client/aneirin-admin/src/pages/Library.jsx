import { useRef, useState } from "react";
import "../styles/library.css"
import Modal from "../components/Modal";
import * as mmb from "music-metadata-browser";

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;



export default function Library(props) {
    const [dragged, setDragged] = useState(false);
    const [filesState, setFiles] = useState([]);
    const [tracksState, setTracks] = useState({});



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
        console.log(alreadyRegisteredFiles);
        console.log(alreadyRegisteredFiles == null ? "No registered files yet" : "Registered ffiles!");
        const stateFiles = alreadyRegisteredFiles == null ? [...filesState] : alreadyRegisteredFiles;
        // console.log(stateFiles);

        // Retrieves the individual files
        var fileEntries = entries.filter(entry => entry.isFile);
        var filesAdded = 0;

        // Adds scanning state variables to check for completion
        var additionDone = false;
        var scanningDone = false;

        // Gets the File objects and push it to the the array
        var files = [];
        fileEntries.forEach(entry => {
            entry.file(file => {
                files.push(file);
                filesAdded += 1;
            });
        });



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
            // Here we copy the tracks object rather than modifying it so the setTracks sees a new object
            // and not the one currently in state. This results in React re-rendering the component. 
            // Reusing the same object would be more memory efficient, but update would not be shown live
            var t = { ...tracks }
            t[files[index].webkitRelativePath + files[index].name] = metadata;
            tracks = t;
            setTracks(t);
        }

        // Sets the scan variables and starts the interval to scan the individual files
        var filesScanned = 0;
        var scanning = false;
        var scanInterval = setInterval(async () => {
            var files = getFiles();

            // If all the files were added to the files and another interval is not busy with the state variable
            if (additionDone && filesScanned < getFiles().length && !scanning) {
                // Sets the scanning variable
                scanning = true;

                // Retrieves the metadata and adds it to the tracks
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

                // // Sets the new state variable and unset the scanning variable.
                scanning = false;
            }

            // Adds the files in the state variable 
            else if (!additionDone && typeof (files) !== "undefined" && filesAdded >= fileEntries.length) {
                files = stateFiles.concat(files);
                additionDone = true;
                setFiles(files);
            }

            // If all the files were scanned, stops the interval
            else if (filesScanned >= files.length) {
                scanningDone = true;
                clearInterval(scanInterval);
            }
        }, 100);

        // Retrieves the directories
        var directoryReaders = entries.filter(entry => entry.isDirectory).map(entry => entry.createReader());
        var scannedFolders = 0;
        var unscannedEntries = [];

        // Starts a scan job to enumerate the sub directories
        directoryReaders.forEach(reader => {
            reader.readEntries(entries => {
                entries.forEach(entry => {
                    unscannedEntries.push(entry);
                })
                scannedFolders += 1;
            })
        });

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



    const confirmHandler = () => {
        if (filesState.length > 0) {
            filesState[0].arrayBuffer().then(buf => {
                var t = new Uint8Array(buf)
            });
        }
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

            <Modal title="Track upload" confirm="Upload" confirmHandler={confirmHandler} cancel="Cancel" ref={modalRef}>
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