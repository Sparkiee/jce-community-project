import React, { useEffect, useState } from "react";
import "../styles/Styles.css";
import "../styles/Navbar.css";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import { updateDoc, doc, onSnapshot, getDoc } from "firebase/firestore";
import { db } from "../firebase";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import MessageIcon from "@mui/icons-material/Message";

function Navbar() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    // Listener for authentication state
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // AUTOMATIC UPDATE FOR NOTIFICATIONS, DO NOT REMOVE THIS CODE
        const unsubscribeSnapshot = onSnapshot(doc(db, "members", user.email), (doc) => {
          const data = doc.data();
          sessionStorage.setItem("user", JSON.stringify(data));
          // Directly update notifications from the document data
          setNotifications(data?.Notifications?.length || 0);
          setFullName(data?.fullName || "");
        });

        // Return the unsubscribe function for the Firestore listener
        return () => unsubscribeSnapshot();
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

  const handleNotifications = async () => {
    if (notificationsVisible) {
      setNotificationsVisible(false);
      return;
    }
    setDisplayNotifications([]);
    setNotificationsVisible(true);
    const member = JSON.parse(sessionStorage.getItem("user"));
    if (!member || !member.email) return;
    const docRef = doc(db, "members", member.email);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotifications(data?.Notifications?.length || 0);
        let notifications = docSnap.data().Notifications || [];
        const firstNotifications = notifications.slice(0, 6); // Get the first 6 notifications
        notifications = notifications.slice(6); // Remove the first 6 notifications
        let notificationMessages = [];
        firstNotifications.forEach((element) => {
          notificationMessages.push(element.message);
        });

        setDisplayNotifications(notificationMessages);

        // Update the document with the modified notifications array
        await updateDoc(docRef, { Notifications: notifications });
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  return (
    <header>
      <div className="navbar-container">
        <div className="navbar">
          <div className="logo">
            <a to="/home" onClick={() => navigate("/home")}>
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
                <svg
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#000000">
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <title>search</title>
                    <desc>Created with Sketch Beta.</desc>
                    <defs></defs>
                    <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
                      <g
                        id="Icon-Set"
                        transform="translate(-256.000000, -1139.000000)"
                        fill="#000000">
                        <path
                          d="M269.46,1163.45 C263.17,1163.45 258.071,1158.44 258.071,1152.25 C258.071,1146.06 263.17,1141.04 269.46,1141.04 C275.75,1141.04 280.85,1146.06 280.85,1152.25 C280.85,1158.44 275.75,1163.45 269.46,1163.45 L269.46,1163.45 Z M287.688,1169.25 L279.429,1161.12 C281.591,1158.77 282.92,1155.67 282.92,1152.25 C282.92,1144.93 276.894,1139 269.46,1139 C262.026,1139 256,1144.93 256,1152.25 C256,1159.56 262.026,1165.49 269.46,1165.49 C272.672,1165.49 275.618,1164.38 277.932,1162.53 L286.224,1170.69 C286.629,1171.09 287.284,1171.09 287.688,1170.69 C288.093,1170.3 288.093,1169.65 287.688,1169.25 L287.688,1169.25 Z"
                          id="search"></path>
                      </g>
                    </g>
                  </g>
                </svg>
                <input type="text" placeholder="חיפוש משתמש" className="search-input-nav" />
              </li>
            </ul>
            <div className="left-side-nav">
              <MessageIcon className="message-icon" />
              <IconButton color="primary" onClick={() => handleNotifications()}>
                <Badge badgeContent={notifications} color="primary">
                  <NotificationsIcon className="notification-icon" />
                </Badge>
              </IconButton>
              {notificationsVisible && (
                <div className="notification-dropdown">
                  <div className="notification-title">התראות</div>
                  {displayNotifications.length > 0 &&
                    displayNotifications.map((notification, index) => (
                      <div key={index} className="notification-item">
                        <Divider />
                        {notification}
                      </div>
                    ))}
                  {displayNotifications.length === 0 && (
                    <div className="notification-item">
                      <Divider />
                      אין התראות חדשות
                    </div>
                  )}
                  <Divider />
                  <div className="notification-actions">
                    <a
                      href="#"
                      className="notification-button"
                      onClick={() => setNotificationsVisible(false)}>
                      סגור
                    </a>
                    <a
                      href="#"
                      className="notification-button"
                      onClick={() => {
                        handleNotifications();
                      }}>
                      הצג עוד
                    </a>
                  </div>
                </div>
              )}
              <Avatar alt={fullName} src={require("../assets/profile.jpg")} />
              <a className="logout-button" to="/logout" onClick={() => disconnect()}>
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
