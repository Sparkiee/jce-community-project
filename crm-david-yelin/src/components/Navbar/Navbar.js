import React, { useEffect, useState } from "react";
import "../../styles/Navbar.css";
import { auth, db } from "../../firebase.js";
import { onAuthStateChanged } from "firebase/auth";
import { setDoc, doc, onSnapshot } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import Logo from "./Logo.js";
import NavItems from "./NavItems.js";
import Search from "./Search.js";
import Notification from "./Notification.js";
import LogoutButton from "./LogoutButton.js";

const Navbar = () => {
  const [notifications, setNotifications] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // AUTOMATIC UPDATE FOR NOTIFICATIONS, DO NOT REMOVE THIS CODE
        // Set up the Firestore document listener within the auth state change handler
        // const unsubscribeSnapshot = onSnapshot(doc(db, "members", user.email), (doc) => {
        //   const data = doc.data();
        //   sessionStorage.setItem("user", JSON.stringify(data));
        //   // Directly update notifications from the document data
        //   setNotifications(data?.Notifications?.length || 0);
        // });

        // // Return the unsubscribe function for the Firestore listener
        // return () => unsubscribeSnapshot();
      } else {
        // Clear the notifications when the user signs out
        setNotifications(0);
      }
    });
    // Return the unsubscribe function for the auth listener
    return () => unsubscribeAuth();
  }, []);

  const disconnect = () => {
    auth.signOut();
    sessionStorage.removeItem("user");
    navigate("/");
  };

  const handleNotifications = async () => {
    const member = JSON.parse(sessionStorage.getItem("user"));
    try {
      const docRef = doc(db, "members", member.email);
      await setDoc(docRef, { Notifications: [] }, { merge: true });
      setNotifications(0);
    } catch (error) {
      console.error("Failed to update notifications:", error);
    }
  };

  return (
    <header>
      <div className="navbar-container">
        <div className="navbar">
          <Logo />
          <div className="nav-items">
            <div className="right-side-nav">
              <NavItems />
              <Search />
            </div>
            <div className="left-side-nav">
              <Notification notifications={notifications} onClick={handleNotifications} />
              <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                stroke="#ffffff">
                <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M12.12 12.78C12.05 12.77 11.96 12.77 11.88 12.78C10.12 12.72 8.71997 11.28 8.71997 9.50998C8.71997 7.69998 10.18 6.22998 12 6.22998C13.81 6.22998 15.28 7.69998 15.28 9.50998C15.27 11.28 13.88 12.72 12.12 12.78Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"></path>
                  <path
                    d="M18.74 19.3801C16.96 21.0101 14.6 22.0001 12 22.0001C9.40001 22.0001 7.04001 21.0101 5.26001 19.3801C5.36001 18.4401 5.96001 17.5201 7.03001 16.8001C9.77001 14.9801 14.25 14.9801 16.97 16.8001C18.04 17.5201 18.64 18.4401 18.74 19.3801Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"></path>
                  <path
                    d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"></path>
                </g>
              </svg>
              <LogoutButton onClick={disconnect} />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
