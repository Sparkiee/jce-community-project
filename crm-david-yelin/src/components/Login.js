import React from 'react';
import "../styles/Login.css";


function Login () {
  return (
    <div className="container">
    <div className="login-box">
      <h1 className="title">!שלום</h1>
      <p className="subtitle">נא הכנס שם משתמש וסיסמא</p>
      <form>
        <div className="input-container">
          <input type="text" placeholder="שם משתמש" className="input" />
        </div>
        <div className="input-container">
          <input type="password" placeholder="סיסמא" className="input" />
        </div>
        <button type="submit" className="button">התחבר</button>
        <div className="forgot-password">
            <a href="#forgot-password">?שכחת את הסיסמא</a>
          </div>
      </form>
    </div>
  </div>
  );
};

export default Login;
