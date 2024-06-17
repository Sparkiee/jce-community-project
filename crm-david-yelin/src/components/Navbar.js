import React, { useEffect, useState } from "react";
import "../styles/Navbar.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import { setDoc, doc } from "firebase/firestore";
import { db } from "../firebase";

function Navbar() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);

  useEffect(() => {
    // Listener for authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const member = JSON.parse(sessionStorage.getItem("user"));
        if (!member.Notifications) setNotifications(0);
        else setNotifications(member.Notifications.length);
      }
    });

    // Cleanup the listener on unmount
    return () => unsubscribeAuth();
  }, []);

  const disconnect = () => {
    navigate("/");
    sessionStorage.removeItem("user");
    auth.signOut();
  };

  const handleNotifications = () => {
    const member = JSON.parse(sessionStorage.getItem("user"));
    try {
      const docRef = doc(db, "members", member.email); // Assuming user's uid is used as document id
      setDoc(docRef, { Notifications: [] }, { merge: true });
      setNotifications(0);
    } catch (error) {}
  };

  

  return (
    <header>
      <div className="navbar-container">
        <div className="navbar">
          <div className="logo">
            <a to="#" onClick={() => navigate("#")}>
              <img
                className="logo-img"
                src={require("../assets/aguda.png")}
                alt="aguda icon"
              />
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
              <li>
                <a to="/contact" onClick={() => navigate("/contact")}>
                  תקשורת
                </a>
              </li>
              <li className="search-li-nav">
                <svg
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g
                    id="SVGRepo_tracerCarrier"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>search</title>
                    <desc>Created with Sketch Beta.</desc>
                    <defs></defs>
                    <g
                      id="Page-1"
                      stroke="none"
                      strokeWidth="1"
                      fill="none"
                      fillRule="evenodd"
                    >
                      <g
                        id="Icon-Set"
                        transform="translate(-256.000000, -1139.000000)"
                        fill="#000000"
                      >
                        <path
                          d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
                          id="search"
                        ></path>
                      </g>
                    </g>
                  </g>
                </svg>
                <input
                  type="text"
                  placeholder="חיפוש משתמש"
                  className="search-input-nav"
                />
              </li>
            </ul>
            <div className="left-side-nav">
              <IconButton color="primary" onClick={() => handleNotifications()}>
                <Badge badgeContent={notifications} color="primary">
                  <NotificationsIcon className="notification-icon" />
                </Badge>
              </IconButton>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#ffffff"
              >
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g
                  id="SVGRepo_tracerCarrier"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                ></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  ></path>
                </g>
              </svg>
              <a
                className="logout-button"
                to="/logout"
                onClick={() => disconnect()}
              >
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
