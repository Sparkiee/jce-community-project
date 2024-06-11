import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "../styles/LoginForm.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
        console.log("Email not verified");
        setIsEmailVerified(false);
        return;
      }

      // Signed in
      const user = userCredential.user;
      const docRef = doc(db, "members", user.email); // Assuming user's uid is used as document id
      const docSnap = await getDoc(docRef);

      // You can now use docSnap to access the document data
      if (docSnap.exists()) {
        sessionStorage.setItem("user", JSON.stringify(docSnap.data()));
      }
      setWrongCredentials(false);
      navigate("/profile");
    } catch (error) {
      setWrongCredentials(true);
    }
  }

  return (
    <div className="container">
      <div className="login">
        <h1 className="title">שלום!</h1>
        <p className="subtitle">נא הכנס שם משתמש וסיסמה</p>
        <div className="error-messages">
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
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
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
          <button type="submit" className="login-button">
            התחברות
          </button>
          <button type="submit" className="registration-button">
            הרשמה
          </button>
          <div className="forgot-box">
            <a href="#forgot-password" className="forgot-password">
              שכחתי סיסמה
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
