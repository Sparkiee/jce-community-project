import { useState } from "react";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    } catch (error) {
      const errorCode = error.code;
      const errorMessage = error.message;
      console.log("Error: ", errorCode, errorMessage);
      setWrongCredentials(true);
    }
  }

  return (
    <div className="login">
      <h2 className="title">התחברות</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-box">
          <div className="email">
            <input
              type="email"
              placeholder="אימייל"
              className="styled-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="password">
            <input
              type="password"
              placeholder="סיסמה"
              className="styled-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
        </div>
        <button type="submit" className="styled-button">
          התחבר
        </button>
        {wrongCredentials && (
          <p style={{ color: "red" }}>פרטי ההתחברות שגויים</p>
        )}
      </form>
    </div>
  );
}

export default LoginForm;
