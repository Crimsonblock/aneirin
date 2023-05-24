import { Outlet } from "react-router";
import SideMenu from "./SideMenu";


export default function Layout() {
    return (
        <div id="app">

            <SideMenu />
            <div id="appContainer">
                <Outlet />
            </div>

        </div>
    );
}