import { useState, useEffect } from "react";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import "../styles/LoginForm.css";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [wrongCredentials, setWrongCredentials] = useState(false);
  const [isEmailVerified, setIsEmailVerified] = useState(true);
  const [verificationSent, setVerificationSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }

      if (!email || !password) {
        setWrongCredentials(true);
        return;
      }

      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (!userCredential.user.emailVerified) {
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
        if (rememberMe) {
          localStorage.setItem("user", JSON.stringify(docSnap.data()));
        }
      }
      setWrongCredentials(false);
      navigate("/home");
    } catch (error) {
      setWrongCredentials(true);
      console.log(error);
    }
  }

  return (
    <div className="container">
      <div className="login-style">
        <div className="forms-box">
          <div className="login-logo">
            <img className="login-logo-img" src={require("../assets/aguda.png")} alt="aguda icon" />
            <p>
              אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
            </p>
          </div>
        </div>
        <div className="error-messages">
          {wrongCredentials && (
            <Alert className="feedback-alert login-alert" severity="error">
              פרטי התחברות שגויים
            </Alert>
          )}
          {!isEmailVerified && (
            <Alert
              className="feedback-alert login-alert"
              severity="error"
              onClick={() => {
                setIsEmailVerified(true);
                setVerificationSent(true);
                async function sendVerificationEmail() {
                  try {
                    const userCredential = await signInWithEmailAndPassword(auth, email, password);
                    await sendEmailVerification(userCredential.user);
                  } catch (error) {
                    console.log(error);
                  }
                }
                sendVerificationEmail();
                setTimeout(() => {
                  setVerificationSent(false);
                }, 5000);
              }}>
              אימייל לא אומת, לחץ כאן בכדי לשלוח חדש
            </Alert>
          )}
          {verificationSent && (
            <Alert className="feedback-alert login-alert" severity="info">
              אימייל חדש נשלח לאימות
            </Alert>
          )}
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <h1 className="title">התחברות משתמש</h1>
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
            <div className="show-password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="סיסמה"
                className="forms-input"
                value={password}
                onChange={(event) => {
                  setWrongCredentials(false);
                  setIsEmailVerified(true);
                  setPassword(event.target.value);
                }}
              />
              <div className="password-icon-container">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  edge="end"
                  className="visibility-icon">
                  {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </div>
            </div>
          </div>
          <div className="form-checkbox">
            <input
              className="input-checkbox"
              id="input-checkbox"
              type="checkbox"
              name="remember-me"
              onChange={(event) => {
                setRememberMe(event.target.checked);
              }}></input>
            <label className="label-checkbox" htmlFor="input-checkbox">
              זכור אותי
            </label>
          </div>
          <button type="submit" className="primary-button">
            התחברות
          </button>
          <div className="extra-options">
            <a href="#" className="forgot-password" onClick={() => navigate("forgot-password")}>
              שכחת סיסמה?
            </a>
          </div>
          <div className="registration-button">
            <a href="#" onClick={() => navigate("register")}>
              הרשמה
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginForm;
