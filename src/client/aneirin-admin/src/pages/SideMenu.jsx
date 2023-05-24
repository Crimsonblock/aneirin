import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import "../styles/sideMenu.css";

export default function SideMenu() {
    const location = useLocation();
    return (
        <div id="sideMenu">
            <p id="pageTitle">Configuration Center</p>
            <ul id="navLinksContainer">
                <li key="dashboard" className={location.pathname === "/" ? "navLink current" : "navLink"}>
                    <Link to="/">Dashboard</Link>
                </li>
                <li key="accounts" className={location.pathname === "/accounts" ? "navLink current" : "navLink"}>
                    <Link to="/accounts">Accounts</Link>
                </li>
                <li key="lib" className={location.pathname === "/library" ? "navLink current" : "navLink"}>
                    <Link to="/library">Library</Link>
                </li>
            </ul>
        </div>
    )
}