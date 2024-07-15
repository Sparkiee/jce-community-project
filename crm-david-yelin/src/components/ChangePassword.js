import "../styles/Styles.css";
import "../styles/ChangePassword.css";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";
import React, { useState, useEffect } from "react";
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
  const [user, setUser] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleClickShowNewPassword = () => {
    setShowNewPassword(!showNewPassword);
  };

  const handleClickShowCurrentPassword = () => {
    setShowCurrentPassword(!showCurrentPassword);
  };

  const handleClickShowPasswordConfirm = () => {
    setShowPasswordConfirm(!showPasswordConfirm);
  };

  useEffect(() => {
    const userData = JSON.parse(sessionStorage.getItem("user"));
    if (userData) setUser(userData);
    else {
      const userData = JSON.parse(localStorage.getItem("user"));
      if (userData) setUser(userData);
    }
  }, []);

  function isValidPassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return (
      password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar
    );
  }

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
      if (!isValidPassword(newPassword)) {
        setFormWarning(true);
        setWarningMessage(
          "הסיסמה החדשה חייבת לכלול לפחות 8 תווים, אותיות גדולות וקטנות, מספרים ותווים מיוחדים."
        );
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
        <div className="show-password-input-container">
          <input
            type={showCurrentPassword ? "text" : "password"}
            placeholder="סיסמה נוכחית"
            className="forms-input"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value);
              resetAlerts();
            }}
          />
          <div className="password-icon-container">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowCurrentPassword}
              edge="end"
              className="visibility-icon">
              {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </div>
        </div>
        <div className="show-password-input-container">
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="סיסמה חדשה"
            className="forms-input"
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              resetAlerts();
            }}
          />
          <div className="password-icon-container">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowNewPassword}
              edge="end"
              className="visibility-icon">
              {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </div>
        </div>
        <div className="show-password-input-container">
          <input
            type={showPasswordConfirm ? "text" : "password"}
            placeholder="אימות סיסמה חדשה"
            className="forms-input"
            value={confirmNewPassword}
            onChange={(e) => {
              setConfirmNewPassword(e.target.value);
              resetAlerts();
            }}
          />
          <div className="password-icon-container">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleClickShowPasswordConfirm}
              edge="end"
              className="visibility-icon">
              {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </div>
        </div>
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
