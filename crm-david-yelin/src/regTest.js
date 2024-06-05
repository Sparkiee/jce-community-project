import { useState } from "react";
import { getDoc, setDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase.js"; // Import Firestore instance from firebase.js
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const auth = getAuth();

// // Function to check if email is in awaiting registration database
const checkAwaitingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};
// // Google Sign-In
const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    const email = user.email;

    const isAwaitingRegistration = await checkAwaitingRegistration(email);
    if (isAwaitingRegistration) {
      console.log("User allowed to register:", email);
      console.log("User Information:");
      console.log("Name:", user.displayName);
      console.log("Email:", user.email);
      console.log("Photo URL:", user.photoURL);
      console.log("UID:", user.uid);
      console.log("Email Verified:", user.emailVerified ? "Yes" : "No");
      console.log(user);
      // Proceed with the registration process
    } else {
      console.log("User not allowed to register:", email);
      // TODO: check if member is signed up already, and log him into his account
      await auth.signOut();
      alert("Your email is not authorized for registration.");
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
  }
};

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    // Handle form submission
    try {
      await setDoc(doc(db, "members", username), {
        username: username,
        password: password, // TODO: figure out how to hash this
        email: "test@gmail.com",
        privileges: 0,
        department: "General",
        createdOn: serverTimestamp()
      });
      console.log(`Document written with ID: ${username}`);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <br />
        <label>
          Password:
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button onClick={signInWithGoogle}>
          <img
            src="https://developers.google.com/identity/images/btn_google_signin_dark_normal_web.png"
            alt="Sign in with Google"
          />
        </button>
      </form>
    </div>
  );
}

export default Register;
