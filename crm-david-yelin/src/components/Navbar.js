import React from "react";
import "../styles/Navbar.css";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  return (
    <header>
      <div className="navbar-container">
        <div className="navbar">
          <div className="logo">
            <a to="#" onClick={() => navigate("#")}>
              <img className="logo-img" src={require("../assets/aguda.png")} alt="aguda icon" />
              <p>
                אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
              </p>
            </a>
          </div>
          <div className="nav-items">
            <ul>
              <li>
                <a to="#" onClick={() => navigate("#")}>
                  ראשי
                </a>
              </li>
              <li>
                <a to="/tasks" onClick={() => navigate("/tasks")}>
                  משימות
                </a>
              </li>
              <li>
                <a to="/events" onClick={() => navigate("/events")}>
                  אירועים
                </a>
              </li>
              <li className="search-li-nav">
                <input type="text" placeholder="חיפוש משתמש" className="search-input-nav" />
              </li>
            </ul>
            <div className="left-side-nav">
              <svg
                viewBox="0 0 76 76"
                xmlns="http://www.w3.org/2000/svg"
                version="1.1"
                baseProfile="full"
                enable-background="new 0 0 76.00 76.00"
                fill="#000000">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    fill="#ffffff"
                    fill-opacity="1"
                    stroke-width="0.2"
                    stroke-linejoin="round"
                    d="M 18,26L 53.9999,26C 55.6568,26 56.9999,27.3432 56.9999,29L 56.9999,51C 56.9999,52.6568 55.6567,54 53.9999,54L 18,54C 16.3431,54 15,52.6569 15,51L 15,29C 15,27.3432 16.3432,26 18,26 Z M 20,32.9999L 20,34.9999L 49,34.9999L 49,32.9999L 20,32.9999 Z M 20,38.9999L 20,40.9999L 42,40.9999L 42,38.9999L 20,38.9999 Z M 20,44.9999L 20,46.9999L 49,46.9999L 49,44.9999L 20,44.9999 Z M 22,22L 57.9999,22C 59.6568,22 60.9999,23.3432 60.9999,25L 60.9999,47C 60.9999,48.6568 59.6567,50 57.9999,50L 57.9999,28C 57.9999,26.3431 56.6568,25 54.9999,25L 19,25C 19,23.3432 20.3432,22 22,22 Z "></path>{" "}
                </g>
              </svg>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#ffffff">
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  {" "}
                  <path
                    d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"></path>{" "}
                  <path
                    d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"></path>{" "}
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#ffffff"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"></path>{" "}
                </g>
              </svg>
              <a className="logout-button" to="/logout" onClick={() => navigate("/")}>
                התנתק
              </a>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
