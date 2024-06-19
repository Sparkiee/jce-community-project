import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "../styles/LoginForm.css";
import { CheckBox } from "@mui/icons-material";
import "../styles/Styles.css";
import Alert from '@mui/material/Alert';

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);

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
      const docRef = doc(db, "members", user.email); // Assuming user's uid is used as document id
      const docSnap = await getDoc(docRef);

      // You can now use docSnap to access the document data
      if (docSnap.exists()) {
        sessionStorage.setItem("user", JSON.stringify(docSnap.data()));
      }
      setWrongCredentials(false);
      navigate("/home");
    } catch (error) {
      setWrongCredentials(true);
    }
  }

  return (
    <div className="container">
      <div className="login-style">
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
          <h1 className="title">התחברות משתמש</h1>
          <div className="error-messages">
            {wrongCredentials && (
              <Alert className="feedback-alert login-alert" severity="error">פרטי התחברות שגויים</Alert>
            )}
            {!isEmailVerified && (
                <Alert className="feedback-alert login-alert" severity="error">אימייל לא אומת</Alert>
            )}
          </div>
          <div className="input-container">
            <input
              type="email"
              placeholder="אימייל"
              className="forms-input"
              value={email}
              onChange={(event) => {
                setWrongCredentials(false);
                setIsEmailVerified(true);
                setEmail(event.target.value);
              }}
            />
          </div>
          <div className="input-container">
            <input
              type="password"
              placeholder="סיסמה"
              className="forms-input"
              value={password}
              onChange={(event) => {
                setWrongCredentials(false);
                setIsEmailVerified(true);
                setPassword(event.target.value);
              }}
            />
          </div>
          <div className="form-checkbox">
            <input
              className="input-checkbox"
              id="input-checkbox"
              type="checkbox"
              name="remember-me"
            ></input>
            <label className="label-checkbox" htmlFor="input-checkbox">
              זכור אותי
            </label>
          </div>
          <button type="submit" className="primary-button">
            התחברות
          </button>
          <div className="extra-options">
            <a href="#forgot-password" className="forgot-password">
              שכחת סיסמה?
            </a>
          </div>
          <div className="registration-button">
            <a href="register">הרשמה</a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
