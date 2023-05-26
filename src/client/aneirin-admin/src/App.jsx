import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./pages/Layout";
import Library from "./pages/Library";
import NotFound from "./pages/NotFound";
import {io} from "socket.io-client"

export default function App() {

    const socket = process.env.NODE_ENV === "development" ? io("http://localhost:8080") : io();

    return (
        <BrowserRouter>
            <Routes>
                <Route element={<Layout />}>
                    {/* <Route path="/" element={<DashBoard />} />
                    <Route path="/accounts" element={<Accounts/>} /> */}
                    <Route path="/library" element={<Library socket={socket}/>}/>
                    <Route path="*" element={<NotFound/>}/>
                </Route>
            </Routes>
        </BrowserRouter>
    )
}