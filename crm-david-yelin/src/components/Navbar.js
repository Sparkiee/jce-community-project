import React, { useEffect, useState, useRef } from "react";
import "../styles/Styles.css";
import "../styles/Navbar.css";
import { useNavigate, useLocation } from "react-router-dom";
import { auth } from "../firebase.js";
import Badge from "@mui/material/Badge";
import NotificationsIcon from "@mui/icons-material/Notifications";
import IconButton from "@mui/material/IconButton";
import {
  updateDoc,
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase";
import Divider from "@mui/material/Divider";
import Avatar from "@mui/material/Avatar";
import MessageIcon from "@mui/icons-material/Message";

function Navbar() {
  function stringToColor(string) {
    let hash = 0;
    let i;

    /* eslint-disable no-bitwise */
    for (i = 0; i < string.length; i += 1) {
      hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }

    let color = "#";

    for (i = 0; i < 3; i += 1) {
      const value = (hash >> (i * 8)) & 0xff;
      color += `00${value.toString(16)}`.slice(-2);
    }
    /* eslint-enable no-bitwise */

    return color;
  }

  function stringAvatar(name) {
    const names = name.split(" ");
    const firstInitial = names[0] ? names[0][0] : "";
    const secondInitial = names[1] ? names[1][0] : "";
    return {
      sx: {
        bgcolor: stringToColor(name),
      },
      children: `${firstInitial}${secondInitial}`,
    };
  }

  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(0);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [displayNotifications, setDisplayNotifications] = useState([]);
  const [fullName, setFullName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [messageUnseenCount, setMessageUnseenCount] = useState(0); // [1
  const [user, setUser] = useState(null);
  const location = useLocation();
  const notificationsRef = useRef(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  useEffect(() => {
    let unsubscribeChatsSnapshot = () => {};
    // AUTOMATIC UPDATE FOR NOTIFICATIONS, DO NOT REMOVE THIS CODE
    if (user && user.email && user.privileges >= 1) {
      const unsubscribeMembersSnapshot = onSnapshot(
        doc(db, "members", user.email),
        (doc) => {
          const data = doc.data();
          sessionStorage.setItem("user", JSON.stringify(data));
          // Assuming setNotifications and setFullName are state setters from useState
          setNotifications(data?.Notifications?.length || 0);
          setFullName(data?.fullName || "");
        },
        (error) => {
          console.error("Error fetching document: ", error);
          // Handle the error appropriately
        }
      );
      const chatsQuery = query(
        collection(db, "chats"),
        where("members", "array-contains", user.email)
      );
      unsubscribeChatsSnapshot = onSnapshot(
        chatsQuery,
        (querySnapshot) => {
          const chatsData = [];
          let count = 0;
          querySnapshot.forEach((doc) => {
            // Process each document, for example, pushing to an array
            chatsData.push({ id: doc.id, ...doc.data() });
            doc.data().messages.forEach((message) => {
              if (!message.sender.includes(user.email) && !message.seen) count++;
            });
          });
          setMessageUnseenCount(count);
          // Example: Update state with the fetched chats data
        },
        (error) => {
          console.error("Error fetching chats: ", error);
          // Handle the error appropriately
        }
      );

      // Cleanup function to unsubscribe from the snapshot when the component unmounts
      return () => {
        unsubscribeMembersSnapshot();
        unsubscribeChatsSnapshot();
      };
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const disconnect = () => {
    navigate("/");
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    auth.signOut();
  };

  const isActive = (path) => {
<<<<<<< HEAD
    return location.pathname.includes(path.slice(0, -1));
=======
    if (path === "/tasks") {
      return location.pathname === "/tasks" || location.pathname.startsWith("/task/");
    }
    if (path === "events") {
      return location.pathname === "/events" || location.pathname.startsWith("/event/");
    }
    return location.pathname === path;
>>>>>>> 90c3a1d774b0fa17ebcbfcc374a69e9e92e2fee8
  };

  const handleNotifications = async () => {
    setDisplayNotifications([]);
    setNotificationsVisible(!notificationsVisible);

    if (!user || !user.email) return;

    const docRef = doc(db, "members", user.email);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setNotifications(data?.Notifications?.length || 0);
        let notifications = docSnap.data().Notifications || [];
        const firstNotifications = notifications.slice(0, 6);
        let notificationMessages = [];
        firstNotifications.forEach((element) => {
          notificationMessages.push(element.message);
        });

        setDisplayNotifications(firstNotifications);

        // Update the document with the modified notifications array
        await updateDoc(docRef, { Notifications: notifications });
      } else {
        console.log("No such document!");
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification) {
      if (notification.link) navigate(notification.link);
      deleteNotificationbyID(notification.id);
      setNotificationsVisible(false);
    }
  };

  const deleteNotificationbyID = async (id) => {
    if (!user || !user.email) return;
    const docRef = doc(db, "members", user.email);
    try {
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        let notifications = docSnap.data().Notifications || [];
        notifications = notifications.filter((notification) => notification.id !== id);
        await updateDoc(docRef, { Notifications: notifications });
      }
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  };

  const handleSearch = async (e) => {
    const searchValue = e.target.value;
    setSearchQuery(searchValue);
    if (searchValue.length < 2) {
      setSearchResults([]);
      return;
    }

    const q = query(
      collection(db, "members"),
      where("fullName", ">=", searchValue),
      where("fullName", "<=", searchValue + "\uf8ff")
    );
    const querySnapshot = await getDocs(q);
    const results = querySnapshot.docs.map((doc) => doc.data());
    setSearchResults(results);
  };

  function handleProfileClick() {
    navigate(`/profile/${user.email}`);
  }

  useEffect(() => {
    setSearchQuery("");
    setSearchResults([]);
  }, [location]);

  return (
    <header>
      <div className="navbar-container">
        <div className="navbar">
          <div className="logo">
            <a to="#" onClick={() => navigate("/home")}>
              <img className="logo-img" src={require("../assets/aguda.png")} alt="aguda icon" />
              <p>
                אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
              </p>
            </a>
          </div>
          <div className="nav-items">
            <ul>
              <li className={isActive("/home") ? "active" : ""}>
                <a to="#" onClick={() => navigate("/home")}>
                  ראשי
                </a>
              </li>
              <li className={isActive("/tasks") ? "active" : ""}>
                <a to="#" onClick={() => navigate("/tasks")}>
                  משימות
                </a>
              </li>
              <li className={isActive("/events") ? "active" : ""}>
                <a to="#" onClick={() => navigate("/events")}>
                  אירועים
                </a>
              </li>
              {user &&
                (user.privileges >= 2 ||
                  (Array.isArray(user.adminAccess) &&
                    user.adminAccess.includes("viewStatistics"))) && (
                  <li className={isActive("/statistics") ? "active" : ""}>
                    <a to="#" onClick={() => navigate("/statistics")}>
                      סטטיסטיקות
                    </a>
                  </li>
                )}
              {user &&
                (user.privileges >= 2 ||
                  (Array.isArray(user.adminAccess) &&
                    (user.adminAccess.includes("createUser") ||
                      user.adminAccess.includes("manageUser") ||
                      user.adminAccess.includes("manageAdmin")))) && (
                  <li className={isActive("/users") ? "active" : ""}>
                    <a to="#" onClick={() => navigate("/users")}>
                      ניהול משתמשים
                    </a>
                  </li>
                )}
              {user &&
                ((user.privileges > 0 && user.privileges >= 2) ||
                  (Array.isArray(user.adminAccess) &&
                    (user.adminAccess.includes("editDepartment") ||
                      user.adminAccess.includes(
                        "deleteDepartment" || user.adminAccess.includes("createDepartment")
                      )))) && (
                  <li className={isActive("/departments") ? "active" : ""}>
                    <a to="#" onClick={() => navigate("/departments")}>
                      ניהול מחלקות
                    </a>
                  </li>
                )}
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
                <input
                  type="text"
                  placeholder="חיפוש משתמש"
                  className="search-input-nav"
                  value={searchQuery}
                  onChange={handleSearch}
                  onBlur={() => {
                    setTimeout(() => {
                      setSearchQuery();
                      setSearchResults([]);
                    }, 200);
                  }}
                />
                {searchQuery && (
                  <div className="search-results">
                    {searchResults.length > 0 ? (
                      searchResults.map((result, index) => {
                        return (
                          <React.Fragment key={index}>
                            {index > 0 && <Divider />}
                            <div
                              onClick={() => navigate(`/profile/${result.email}`)}
                              className={`search-result-item ${
                                result.privileges === 0 ? "strikethrough" : ""
                              }`}>
                              {result.fullName}
                            </div>
                          </React.Fragment>
                        );
                      })
                    ) : (
                      <div className="no-result-found">לא נמצאה התאמה.</div>
                    )}
                  </div>
                )}
              </li>
            </ul>
            <div className="left-side-nav">
              <IconButton color="primary" onClick={() => navigate(`/chat`)}>
                <Badge badgeContent={messageUnseenCount} color="primary">
                  <MessageIcon className="message-icon" />
                </Badge>
              </IconButton>
              <IconButton color="primary" onClick={() => handleNotifications()}>
                <Badge badgeContent={notifications} color="primary">
                  <NotificationsIcon className="notification-icon" />
                </Badge>
              </IconButton>
              {notificationsVisible && (
                <div ref={notificationsRef} className="notification-dropdown">
                  <div className="notification-title">התראות</div>
                  {displayNotifications.length > 0 &&
                    displayNotifications.map((notification, index) => (
                      <div
                        key={index}
                        className="notification-item"
                        onClick={() => handleNotificationClick(notification)}>
                        <Divider />
                        <p>
                          {notification.message.substring(0, 90)}
                          {notification.message.length > 90 ? "..." : ""}
                        </p>
                      </div>
                    ))}
                  {displayNotifications.length === 0 && (
                    <div className="notification-item">
                      <Divider />
                      <p>אין התראות חדשות</p>
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
              {user && (
                <Avatar
                  {...stringAvatar(user.fullName)}
                  title={fullName}
                  onClick={() => handleProfileClick()}
                />
              )}
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
