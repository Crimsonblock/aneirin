import { useRef, useState } from "react";
import "../styles/library.css"
import Modal from "../components/Modal";
import * as mmb from "music-metadata-browser";

import * as buffer from "buffer";
window.Buffer = buffer.Buffer;


export default function Library(props) {
    const [dragged, setDragged] = useState(false);
    const [filesState, setFiles] = useState([]);
    const [tracks, setTracks] = useState({});
    const modalRef = useRef(null);
    const showModal = () => {
        modalRef.current.show();
    }


    const getFirstFiles = (dataTransfer) => {
        var files = [...filesState];
        var dataTransferItems = [...dataTransfer.items].map(e => e.webkitGetAsEntry());
        [...dataTransfer.files].filter((el, i) => dataTransferItems[i].isFile).
            filter(el => (el.type.includes("audio") || el.type.includes("fideo/mp4")))
            .forEach(file => {
                files.push(file);
            });
        setFiles(files);

        dataTransferItems = dataTransferItems.filter(e => e.isDirectory).map(e => e.createReader());
        console.log(dataTransferItems);
        // dataTransferItems.forEach(reader=>{
        //     reader.readEntries(entries=>{
        //         console.log(entries.map(e => e.constructor.name));
        //     })
        // })

        console.log("Finished");

    }


    const dropHandler = (event) => {

        // var dataTransferItems= [...event.dataTransfer.items].map(e=>e.webkitGetAsEntry());

        // console.log([...event.dataTransfer.files].map((el, i) =>({element: el, index:i})).filter((el, i) => i%2==0 ));
        // console.log([...event.dataTransfer.files].filter((el, i) => dataTransferItems[i].isFile));
        // console.log(dataTransferItems);

        getFirstFiles(event.dataTransfer);


        // console.log(event.dataTransfer);
        event.preventDefault();
        setDragged(false);

        // getFiles([...event.dataTransfer.items].map(e => e.webkitGetAsEntry()));
        return;
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
                                <td>A life sent on</td>
                                <td>Xenoblade Chronicles 3</td>
                                <td>Yasunori Mitsuda</td>
                                <td>-</td>
                                <td>1</td>
                                <td>1</td>
                                <td>2022</td>
                            </tr>
                            <tr>
                                <td>The weight of life</td>
                                <td>Xenoblade Chronicles 3</td>
                                <td>Yasunori Mitsuda</td>
                                <td>-</td>
                                <td>59</td>
                                <td>1</td>
                                <td>2022</td>
                            </tr>
                        </tbody>
                    </table>


                </div>
            </div>

            <Modal title="Track upload" confirm="Upload" cancel="Cancel" ref={modalRef}>
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
                                                    <td>{typeof (tracks[file.webkitRelativePath + file.name]) === "undefined" ? "" : tracks[file.webkitRelativePath + file.name].common.title}</td>
                                                    <td>{typeof (tracks[file.webkitRelativePath + file.name]) === "undefined" ? "" : tracks[file.webkitRelativePath + file.name].common.artist}</td>
                                                    <td>{typeof (tracks[file.webkitRelativePath + file.name]) === "undefined" ? "" : tracks[file.webkitRelativePath + file.name].common.album}</td>
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