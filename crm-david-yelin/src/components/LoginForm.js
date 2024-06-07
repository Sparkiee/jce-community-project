import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import "../styles/LoginForm.css";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [wrongCredentials, setWrongCredentials] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const auth = getAuth();
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
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
        </form>
      </div>
    </div>
  );
}

export default LoginForm;

