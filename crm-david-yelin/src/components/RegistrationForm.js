import React from "react";
import "../styles/RegistrationForm.css";

function RegistrationForm() {
  return (
    <div className="registration">
      <h2 className="title">הרשמה</h2>
      <form>
        <div className="input-box">
          <div className="email">
            <input type="email"  placeholder="אימייל" className="styled-input"/>
          </div>
          <div className="password">
            <input type="password" placeholder="סיסמה" className="styled-input"/>
          </div>
        </div>
        <button type="submit" className="styled-button">הירשם</button>
      </form>
    </div>
  );
}

export default RegistrationForm;
