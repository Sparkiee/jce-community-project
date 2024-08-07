import React, { useState, useEffect } from "react";
import "../styles/Styles.css";
import "../styles/ForgotPassword.css";

import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [noEmail, setNoEmail] = useState(false);

  const navigate = useNavigate();

  function handleSubmit(event) {
    setNoEmail(false);
    event.preventDefault();
    if (!email) {
      setNoEmail(true);
      return;
    }
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setEmailSent(true);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorCode, errorMessage);
      });
  }
  return (
    <div className="container">
      <div className="forgot-password-style">
        <a href="#" onClick={() => navigate("/")} className="back-home">
          → חזרה להתחברות
        </a>
        <div className="forms-box">
          <div className="login-logo">
            <img className="login-logo-img" src={require("../assets/aguda.png")} alt="aguda icon" />
            <p>
              אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
            </p>
          </div>
        </div>
        <form className="forgot-password-form" onSubmit={handleSubmit}>
          <h1 className="title-forgot-password">איפוס סיסמה</h1>
          <div className="input-container">
            <input
              type="email"
              placeholder="אימייל"
              className="forms-input"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
              }}
            />
          </div>
          <button type="submit" className="primary-button">
            אפס סיסמה
          </button>
          {emailSent && (
            <Alert className="feedback-alert forgot-password-feedback" severity="info">
              אימייל לאיפוס סיסמה נשלח לכתובת במידה וקיים במערכת
            </Alert>
          )}
          {noEmail && (
            <Alert className="feedback-alert forgot-password-feedback-email" severity="info">
              אנא הכנס אימייל
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
}
export default ForgotPassword;
