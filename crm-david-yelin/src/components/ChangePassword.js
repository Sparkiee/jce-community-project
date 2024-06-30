import "../styles/Styles.css";
import "../styles/ChangePassword.css";

import React, { useState } from "react";
import { auth } from "../firebase";
import { Alert } from "@mui/material";
import { signInWithEmailAndPassword, updatePassword } from "firebase/auth";

function ChangePassword(props) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordChanged, setPasswordChanged] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [formWarning, setFormWarning] = useState(false);
  const user = JSON.parse(sessionStorage.getItem("user"));

  const handleChangePassword = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, user.email, currentPassword);
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        setFormWarning(true);
        setWarningMessage("אנא מלא את כל השדות");
        return;
      }
      if (currentPassword === newPassword) {
        setFormWarning(true);
        setWarningMessage("הסיסמה החדשה צריכה להיות שונה מהסיסמה הנוכחית");
        return;
      }
      if (newPassword !== confirmNewPassword) {
        setFormWarning(true);
        setWarningMessage("הסיסמאות אינן תואמות");
        return;
      }
      if (newPassword.length < 6) {
        setFormWarning(true);
        setWarningMessage("הסיסמה החדשה חייבת להיות באורך של לפחות 6 תווים");
        return;
      }
      await updatePassword(userCredential.user, newPassword);
      setPasswordChanged(true);
    } catch (error) {
      setFormWarning(false);
      setPasswordChangeError(true);
      setTimeout(() => {
        setPasswordChangeError(false);
      }, 5000);
      console.error(error);
    }
  };

  function resetAlerts() {
    setFormWarning(false);
    setPasswordChanged(false);
    setPasswordChangeError(false);
  }

  return (
    <div className="change-password-form">
      <div
        className="action-close"
        onClick={() => {
          props.onClose();
        }}>
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
      <h1 className="change-password-title">שינוי סיסמה</h1>
      <div className="change-password-input-container">
        <input
          type="password"
          placeholder="סיסמה נוכחית"
          className="forms-input"
          value={currentPassword}
          onChange={(e) => {
            setCurrentPassword(e.target.value);
            resetAlerts();
          }}
        />
        <input
          type="password"
          placeholder="סיסמה חדשה"
          className="forms-input"
          value={newPassword}
          onChange={(e) => {
            setNewPassword(e.target.value);
            resetAlerts();
          }}
        />
        <input
          type="password"
          placeholder="אימות סיסמה חדשה"
          className="forms-input"
          value={confirmNewPassword}
          onChange={(e) => {
            setConfirmNewPassword(e.target.value);
            resetAlerts();
          }}
        />
      </div>
      <button type="button" className="primary-button" onClick={handleChangePassword}>
        אפס סיסמה
      </button>
      <div className="change-password-feedback">
        {formWarning && (
          <Alert className="feedback-alert feedback-changepass" severity="warning">
            {warningMessage}
          </Alert>
        )}
        {passwordChanged && (
          <Alert className="feedback-alert feedback-changepass" severity="success">
            הסיסמה שונתה בהצלחה
          </Alert>
        )}
        {passwordChangeError && (
          <Alert className="feedback-alert feedback-changepass" severity="error">
            הסיסמה הנוכחית אינה נכונה
          </Alert>
        )}
      </div>
    </div>
  );
}

export default ChangePassword;
