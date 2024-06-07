import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const[isEmailVerified, setIsEmailVerified] = useState(true);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (!userCredential.user.emailVerified) {
        console.log("Email not verified");
        setIsEmailVerified(false);
        return;
      }

      // Signed in
      const user = userCredential.user;
      console.log("User signed in: ", user);
      setWrongCredentials(false);
      navigate("/profile");
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log("Error: ", errorCode, errorMessage);
      setWrongCredentials(true);
    }
  }

  return (
    <div className="container">
      <div className="login">
        <h1 className="title">!שלום</h1>
        <p className="subtitle">נא הכנס שם משתמש וסיסמה</p>
        <form onSubmit={handleSubmit}>
          <div className="input-container">
            <input
              type="email"
              placeholder="אימייל"
              className="styled-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="input-container">
            <input
              type="password"
              placeholder="סיסמה"
              className="styled-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button type="submit" className="button">
            התחבר
          </button>
          <div className="forgot-box">
            <a href="#forgot-password" className="forgot-password">?שכחת את הסיסמא</a>
          </div>
          {wrongCredentials && (
            <div className="incorrect-box">
              <p className="incorrect-message">פרטי ההתחברות שגויים</p>
            </div>
          )}
          {!isEmailVerified && (
            <div className="incorrect-box">
              <p className="incorrect-message">אימייל לא מאומת</p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default LoginForm;

