import React, { useEffect } from "react";
import { auth } from "../firebase"; // Import auth from firebase.js
import Navbar from "./Navbar";
import "../styles/HomePage.css";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (!user) {
        console.log("User is not logged in");
        navigate("/");
      } else {
        console.log("User is logged in");
      }
    });
  }, []);

  return (
    <div className="HomePage">
      <Navbar />
      <p>Welcome to David Yelin CRM</p>
    </div>
  );
}

export default HomePage;
