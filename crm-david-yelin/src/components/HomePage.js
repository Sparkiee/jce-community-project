import React from "react";
import Navbar from './Navbar';
import './HomePage.css';

function HomePage() {
  return (
    <div className="HomePage">
        <Navbar />
        <p>
          Welcome to David Yelin CRM
        </p>
    </div>
  );
}

export default HomePage;