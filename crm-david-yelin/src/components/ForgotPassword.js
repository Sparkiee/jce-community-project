import React, { useState } from "react";
import "../styles/Styles.css";
import "../styles/ForgotPassword.css";

import { auth } from "../firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { Alert } from "@mui/material";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  function handleSubmit(event) {
    event.preventDefault();
    sendPasswordResetEmail(auth, email)
      .then(() => {
        setEmailSent(true);
        setTimeout(() => {
          setEmailSent(false);
        }, 5000);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        // ..
      });
  }
  return (
    <div className="container">
      <div className="login-style">
      <a href="/home" className="back-home">
          → חזרה לעמוד הראשי
        </a>
        <div className="forms-box">
          <div className="login-logo">
            <img
              className="login-logo-img"
              src={require("../assets/aguda.png")}
              alt="aguda icon"
            />
            <p>
              אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
            </p>
          </div>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
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
            <Alert className="feedback-alert" severity="info">
              אימייל לאיפוס סיסמה נשלח לכתובת במידה וקיים במערכת
            </Alert>
          )}
        </form>
      </div>
    </div>
  );
}
export default ForgotPassword;
