import "../styles/Styles.css";
import "../styles/EditAccess.css";

import React, { useState } from "react";
import Checkbox from "@mui/material/Checkbox";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { Alert } from "@mui/material";

function EditAccess(props) {
  const [permSuccess, setPermSuccess] = useState(false);
  const [checkAll, setCheckAll] = useState(false);
  const [access, setAccess] = useState({
    createTask: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createTask"),
    editTask: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("editTask"),
    deleteTask: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteTask"),
    createEvent: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createEvent"),
    editEvent: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("editEvent"),
    deleteEvent: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteEvent"),
    createUser: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createUser"),
    manageUser: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("manageUser"),
    manageAdmin: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("manageAdmin"),
    deleteComment: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteComment"),
    editDepartment: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("editDepartment"),
    deleteDepartment: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteDepartment"),
    createDepartment: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("createDepartment"),
    uploadFile: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("uploadFile"),
    deleteFile: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("deleteFile"),
    viewStatistics: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("viewStatistics"),
    viewBudget: Array.isArray(props.target.adminAccess) && props.target.adminAccess.includes("viewBudget")
  });

  const handleCheckAllChange = (event) => {
    const newCheckAll = event.target.checked;
    setCheckAll(newCheckAll);
    setAccess({
      createTask: newCheckAll,
      editTask: newCheckAll,
      deleteTask: newCheckAll,
      createEvent: newCheckAll,
      editEvent: newCheckAll,
      deleteEvent: newCheckAll,
      createUser: newCheckAll,
      manageUser: newCheckAll,
      manageAdmin: newCheckAll,
      deleteComment: newCheckAll,
      editDepartment: newCheckAll,
      deleteDepartment: newCheckAll,
      createDepartment: newCheckAll,
      uploadFile: newCheckAll,
      deleteFile: newCheckAll,
      viewStatistics: newCheckAll,
      viewBudget: newCheckAll,
    });
  };

  const handleChange = (event) => {
    const newAccess = { ...access, [event.target.name]: event.target.checked };
    setAccess(newAccess);

    const allChecked = Object.values(newAccess).every((value) => value);
    setCheckAll(allChecked);
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
        <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <form className="edit-access-form" onSubmit={handleSubmit}>
        <h2 className="title-edit-access">עריכת גישה</h2>
        <div className="edit-access-input edit-access-all">
          <label>
            <Checkbox
              name="checkAll"
              sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
              checked={checkAll}
              onChange={handleCheckAllChange}
            />
            בחירת כל ההרשאות
          </label>
        </div>
        <div className="edit-access-input-box">
          <div className="edit-access-box-right">
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="deleteComment"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.deleteComment}
                  onChange={handleChange}
                />
                מחיקת תגובה בפורום
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="createUser"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.createUser}
                  onChange={handleChange}
                />
                יצירת משתמש
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="manageUser"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.manageUser}
                  onChange={handleChange}
                />
                ניהול משתמש
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="manageAdmin"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.manageAdmin}
                  onChange={handleChange}
                />
                ניהול הרשאות
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="editDepartment"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.editDepartment}
                  onChange={handleChange}
                />
                עריכת מחלקה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="deleteDepartment"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.deleteDepartment}
                  onChange={handleChange}
                />
                מחיקת מחלקה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="createDepartment"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.createDepartment}
                  onChange={handleChange}
                />
                יצירת מחלקה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="viewStatistics"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.viewStatistics}
                  onChange={handleChange}
                />
                צפיה בסטטיסטיקות
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="viewBudget"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.viewBudget}
                  onChange={handleChange}
                />
               צפיה בתקציב
              </label>
            </div>
          </div>
          <div className="edit-access-box-left">
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="createTask"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.createTask}
                  onChange={handleChange}
                />
                יצירת משימה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="editTask"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.editTask}
                  onChange={handleChange}
                />
                עריכת משימה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="deleteTask"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.deleteTask}
                  onChange={handleChange}
                />
                מחיקת משימה
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="createEvent"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.createEvent}
                  onChange={handleChange}
                />
                יצירת אירוע
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="editEvent"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.editEvent}
                  onChange={handleChange}
                />
                עריכת אירוע
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="deleteEvent"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.deleteEvent}
                  onChange={handleChange}
                />
                מחיקת אירוע
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="uploadFile"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.uploadFile}
                  onChange={handleChange}
                />
                העלאת קבצים
              </label>
            </div>
            <div className="edit-access-input">
              <label>
                <Checkbox
                  name="deleteFile"
                  sx={{ "& .MuiSvgIcon-root": { fontSize: 28 } }}
                  checked={access.deleteFile}
                  onChange={handleChange}
                />
                מחיקת קבצים
              </label>
            </div>
          </div>
        </div>
        <button type="submit" className="primary-button extra-reg">
          עדכן פרטים
        </button>
        <div className="edit-access-feedback">
          {permSuccess && (
            <Alert className="feedback-alert" severity="success">
              הרשאות עודכנו בהצלחה
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}
export default EditAccess;
