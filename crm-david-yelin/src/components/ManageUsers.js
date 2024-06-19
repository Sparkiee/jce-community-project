import React from "react";
import Navbar from "./Navbar";
import "../styles/ManageUser.css";

function ManageUsers() {
  return (
    <div>
      <Navbar />
      <div className="manage-users-content">
        <div className="page-title">מערכת ניהול משתמשים</div>
        <div className="manage-users-table">
            edit
        </div>
      </div>
    </div>
  );
}
export default ManageUsers;
