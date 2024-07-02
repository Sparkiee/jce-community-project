import "../styles/Styles.css";
import "../styles/EditAccess.css";

import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { Alert } from "@mui/material";

function EditAccess(props) {
  const [permSuccess, setPermSuccess] = useState(false);
  const [access, setAccess] = useState({
    createTask:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createTask"),
    editTask:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("editTask"),
    deleteTask:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteTask"),
    createEvent:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createEvent"),
    editEvent:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("editEvent"),
    deleteEvent:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteEvent"),
    createUser:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createUser"),
    manageUser:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("manageUser"),
    manageAdmin:
      Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("manageAdmin")
  });

  const handleChange = (event) => {
    setAccess({ ...access, [event.target.name]: event.target.checked });
  };

  async function handleSubmit(event) {
    event.preventDefault();
    const updatedAdminAccess = [];

    for (const [key, value] of Object.entries(access)) {
      if (value) {
        updatedAdminAccess.push(key);
      }
    }

    try {
      const memberRef = doc(db, "members", props.target.email);
      await updateDoc(memberRef, {
        adminAccess: updatedAdminAccess
      });
      setPermSuccess(true);
      setTimeout(() => {
        setPermSuccess(false);
        props.onClose();
      }, 2000);
    } catch (error) {
      console.error("Error updating document: ", error);
    }
  }

  return (
    <div className="edit-access">
      <div className="action-close" onClick={props.onClose}>
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor">
          <line
            x1="17"
            y1="7"
            x2="7"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="7"
            y1="7"
            x2="17"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <form className="edit-access-form" onSubmit={handleSubmit}>
        <h2 className="title extra-registration-form-title">עריכת גישה</h2>
        <div className="edit-access-input-box">
          <div className="edit-access-input">
            <Checkbox
              name="createTask"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.createTask}
              onChange={handleChange}
            />
            יצירת משימה
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="editTask"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.editTask}
              onChange={handleChange}
            />
            עריכת משימה
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="deleteTask"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.deleteTask}
              onChange={handleChange}
            />
            מחיקת משימה
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="createEvent"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.createEvent}
              onChange={handleChange}
            />
            יצירת אירוע
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="editEvent"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.editEvent}
              onChange={handleChange}
            />
            עריכת אירוע
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="deleteEvent"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.deleteEvent}
              onChange={handleChange}
            />
            מחיקת אירוע
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="createUser"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.createUser}
              onChange={handleChange}
            />
            יצירת משתמש
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="manageUser"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.manageUser}
              onChange={handleChange}
            />
            ניהול משתמש
          </div>
          <div className="edit-access-input">
            <Checkbox
              name="manageAdmin"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={access.manageAdmin}
              onChange={handleChange}
            />
            ניהול הרשאות
          </div>
        </div>
        <button type="submit" className="primary-button extra-reg">
          עדכן פרטים
        </button>
        {permSuccess && (
          <Alert className="feedback-alert" severity="success">
            הרשאות עודכנו בהצלחה
          </Alert>
        )}
      </form>
    </div>
  );
}
export default EditAccess;
