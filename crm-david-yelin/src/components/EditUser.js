import React, { useEffect, useState } from "react";
import {
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  collection,
  where,
  query,
} from "firebase/firestore";
import { db } from "../firebase.js";
import "../styles/Styles.css";
import "../styles/EditUser.css";
import PhoneInput from "react-phone-number-input/input";
import { Alert } from "@mui/material";
import LockIcon from "@mui/icons-material/Lock";

function EditUser(props) {
  const [firstName, setFirstName] = useState(props.target.firstName || "");
  const [lastName, setLastName] = useState(props.target.lastName || "");
  const [email, setEmail] = useState(props.target.email || "");
  const [phone, setPhone] = useState(props.target.phone || "");
  const [role, setRole] = useState(props.target.role || "");
  const [department, setDepartment] = useState(props.target.department || "");
  const [privileges, setPrivileges] = useState(props.target.privileges) || "";
  const [adminAccess, setAdminAccess] = useState(props.target.adminAccess || []);
  const [profileImage, setProfileImage] = useState(props.target.profileImage || "");
  const [formWarning, setFormWarning] = useState(false);
  const [departmentList, setDepartmentList] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [phoneError, setPhoneError] = useState(false);
  const [isNoSuperAdmin, setIsNoSuperAdmin] = useState(false);
  const [edittedSuccessfully, setEdittedSuccessfully] = useState(false);
  const [removeSuperAdmin, setRemoveSuperAdmin] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!firstName || !lastName || !phone || !department || (privileges < 0 && privileges > 2)) {
      setFormWarning(true);
      return;
    }
    if (phone.length !== 13) {
      setPhoneError(true);
      return;
    }

    // TODO: double check those privileges
    if (user && user.privileges < 2 && props.target.privileges > user.privileges) {
      setRemoveSuperAdmin(true);
      setTimeout(() => {
        setRemoveSuperAdmin(false);
      }, 2000);
      return;
    }
    if (props.target.privileges == 2 && privileges < 2) {
      // Reference to the Firestore "members" collection
      const memberRef = collection(db, "members");

      // Construct the query
      const q = query(memberRef, where("privileges", "==", 2));

      // Fetch the documents matching the query
      const querySnapshot = await getDocs(q);

      // Check if the query snapshot is empty
      if (querySnapshot.empty) {
        return;
      } else {
        // Check if there is only one document with level 3 privileges
        if (querySnapshot.size <= 1) {
          setIsNoSuperAdmin(true);
          setTimeout(() => {
            setIsNoSuperAdmin(false);
          }, 1000);
          return;
        }
      }
    }
    const docRef = doc(db, "members", email);

    try {
      setDoc(docRef, {
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        role: role,
        department: department,
        privileges: privileges,
        lastUpdate: serverTimestamp(),
        adminAccess: adminAccess,
        profileImage: profileImage,
      });
      setEdittedSuccessfully(true);
      setTimeout(() => {
        setEdittedSuccessfully(false);
        props.onClose();
      }, 2000);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  function addDepartment() {
    if (newDepartment && !departmentList.includes(newDepartment)) {
      setDepartmentList([...departmentList, newDepartment]);
      setDepartment(newDepartment);
      try {
        const docRef = doc(db, "departments", newDepartment);
        setDoc(docRef, {
          name: newDepartment,
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    setIsOtherSelected(false);
    setDepartment(newDepartment);
    setNewDepartment("");
  }

  useEffect(() => {
    async function fetchDepartments() {
      try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departments = querySnapshot.docs.map((doc) => doc.data().name);
        setDepartmentList(departments);
      } catch (e) {
        console.error("Error fetching departments: ", e);
      }
    }

    fetchDepartments();
  }, []);

  function resetAlerts() {
    setFormWarning(false);
    setPhoneError(false);
    setIsNoSuperAdmin(false);
    setEdittedSuccessfully(false);
  }
  return (
    <div className="edit-user media-style">
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
      <form className="edit-user-form media-form" onSubmit={handleSubmit}>
        <h2 className="title extra-registration-form-title">עריכת משתמש</h2>
        <div className="edit-user-input-box">
          <input
            type="text"
            placeholder="שם פרטי"
            className="forms-input"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              resetAlerts();
            }}
          />
          <input
            type="text"
            placeholder="שם משפחה"
            className="forms-input"
            value={lastName}
            onChange={(event) => {
              setLastName(event.target.value);
              resetAlerts();
            }}
          />
          <PhoneInput
            defaultCountry="IL"
            placeholder="טלפון"
            className="forms-input"
            maxLength="12"
            value={phone}
            onChange={(value) => {
              setPhone(value);
              resetAlerts();
            }}
            style={{ textAlign: "right" }}
          />
          <LockIcon className="mail-lock-icon" />
          <input
            readOnly
            type="email"
            placeholder="אימייל"
            className="forms-input email-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {user &&
            (user.privileges >= 2 ||
              (Array.isArray(user.adminAccess) &&
                (user.adminAccess.includes("manageUser") ||
                  user.adminAccess.includes("manageAdmin")))) && (
              <>
                <select
                  id="department-select"
                  name="department"
                  value={department}
                  onChange={(event) => {
                    const value = event.target.value;
                    setIsOtherSelected(value === "other");
                    setDepartment(value === "other" ? "" : value);
                  }}
                  className="forms-input">
                  <option value="" disabled>
                    בחר מחלקה
                  </option>
                  {departmentList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                  {user &&
                    (user.privileges >= 2 ||
                      (Array.isArray(user.adminAccess) &&
                        user.adminAccess.includes("createDepartment"))) && (
                      <option value="other">הוסף מחלקה חדשה</option>
                    )}
                </select>
                {isOtherSelected && (
                  <div className="new-department">
                    <input
                      type="text"
                      value={newDepartment}
                      placeholder="שם מחלקה חדשה"
                      onChange={(event) => {
                        setNewDepartment(event.target.value);
                        resetAlerts();
                      }}
                      className="forms-input"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        addDepartment(newDepartment);
                        setNewDepartment("");
                      }}
                      className="primary-button extra-create-user-button">
                      הוסף מחלקה חדשה
                    </button>
                  </div>
                )}
                <input
                  id="role-input"
                  type="text"
                  value={role}
                  onChange={(event) => {
                    setRole(event.target.value);
                    resetAlerts();
                  }}
                  placeholder="תפקיד"
                  className="forms-input"
                />
                <select
                  id="privileges-select"
                  value={privileges}
                  onChange={(event) => {
                    setPrivileges(Number(event.target.value));
                    resetAlerts();
                  }}
                  className="forms-input">
                  {(user.privileges >= 2 || user.adminAccess.includes("manageAdmin")) && (
                    <option value={2}>מנהל ראשי</option>
                  )}
                  <option value={1}>משתמש פעיל</option>
                  <option value={0}>משתמש מושהה</option>
                </select>
              </>
            )}
          <button type="submit" className="primary-button extra-reg">
            עדכן פרטים
          </button>
        </div>
        <div className="edit-user-feedback media-alert">
          {isNoSuperAdmin && (
            <Alert severity="warning" className="feedback-alert feedback-edituser">
              חייב להיות לפחות מנהל ראשי אחד במערכת
            </Alert>
          )}
          {formWarning && (
            <Alert className="feedback-alert" severity="error">
              אנא מלא את כל השדות
            </Alert>
          )}
          {removeSuperAdmin && (
            <Alert className="feedback-alert" severity="error">
              אינך רשאי לשנות למשתמש זה הרשאות
            </Alert>
          )}
          {edittedSuccessfully && (
            <Alert severity="success" className="feedback-alert feedback-edituser">
              פרטי המשתמש עודכנו בהצלחה
            </Alert>
          )}
          {phoneError && (
            <Alert severity="warning" className="feedback-alert feedback-edituser">
              מספר הטלפון אינו תקין
            </Alert>
          )}
        </div>
      </form>
    </div>
  );
}

export default EditUser;
