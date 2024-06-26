import "../styles/Styles.css";
import "../styles/ChangePassword.css";

import React, { useState } from "react";
import { auth } from "../firebase"; // Adjust the import path according to your Firebase configuration file
import { Alert } from "@mui/material";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";

function ChangePassword(props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState(false);

  const user = JSON.parse(sessionStorage.getItem("user"));

  const handleChangePassword = async () => {
    try {
      if (!passwordsMatch) return;
      // Assuming you have the current user logged in
      console.log(user.email, currentPassword, newPassword, confirmNewPassword);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        user.email,
        currentPassword
      ); // Re-authenticate the user
      await updatePassword(userCredential.user, newPassword);
      setPasswordChanged(true);
    } catch (error) {
      setPasswordChangeError(true);
      setTimeout(() => {
        setPasswordChangeError(false);
      }, 5000);
      console.error(error);
    }
  };

  const passwordsMatch = newPassword === confirmNewPassword;

  return (
    <div className="change-password-form">
      <div
        className="action-close"
        onClick={() => {
          props.onClose();
        }}
      >
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
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
      <h1 className="change-password-title">שינוי סיסמה</h1>
      <div className="change-password-input-container">
        <input
          type="password"
          placeholder="סיסמה נוכחית"
          className="forms-input"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="סיסמה חדשה"
          className="forms-input"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <input
          type="password"
          placeholder="אימות סיסמה חדשה"
          className="forms-input"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
        />
      </div>
      <button
        type="button"
        className="primary-button"
        onClick={handleChangePassword}
      >
        אפס סיסמה
      </button>
      {!passwordsMatch && (
        <Alert
          className="feedback-alert feedback-changepass"
          severity="warning"
        >
          הסיסמאות אינן תואמות
        </Alert>
      )}
      {passwordChanged && (
        <Alert
          className="feedback-alert feedback-changepass"
          severity="success"
        >
          הסיסמה שונתה בהצלחה
        </Alert>
      )}
      {passwordChangeError && (
        <Alert className="feedback-alert feedback-changepass" severity="error">
          שגיאה בעת שינוי הסיסמה
        </Alert>
      )}
    </div>
  );
}

export default ChangePassword;
