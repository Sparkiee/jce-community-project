import { React, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getDoc, doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase.js";

import "../styles/RegistrationForm.css";

const checkPendingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

function RegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [id, setId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [pendingAccount, setPendingAccount] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (pendingAccount) {
      timer = setTimeout(() => {
        setPendingAccount(false);
      }, 5000); // Change back to false after 5 seconds
    }
    return () => clearTimeout(timer); // This will clear the timeout if the component unmounts before the timeout finishes
  }, [pendingAccount]);

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const isPendingRegistration = await checkPendingRegistration(
        email.toLowerCase()
      );
      setPendingAccount(!isPendingRegistration);
      if (isPendingRegistration) {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        const user = userCredential.user;
        console.log(`User registered with UID: ${user.uid}`);
        await sendEmailVerification(user);

        try {
          console.log("Writing document...");
          const docRef = doc(db, "members", email);
          await setDoc(docRef, {
            email: email,
            firstName: firstName,
            lastName: lastName,
            id: id,
            phone: phone,
            privileges: 0,
            department: "General",
            createdOn: serverTimestamp()
          });
          console.log("Document successfully written!");
          setAccountExists(true);

          // Delete the document from the awaiting_registration collection
          const awaitingRegistrationDocRef = doc(
            db,
            "awaiting_registration",
            email
          );
          await deleteDoc(awaitingRegistrationDocRef);
          console.log(
            "Document successfully deleted from awaiting_registration!"
          );
          // Navigate to login page
          setTimeout(() => {
            navigate('/');
          }, 5000);
        } catch (e) {
          console.error("Error writing document: ", e);
          setAccountExists(false);
        }
      }
    } catch (e) {}
    // Handle form submission
  }
  return (
    <div className="registration">
      <h2 className="title">הרשמה</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-box">
          <div className="first-name">
            <input
              type="text"
              placeholder="שם פרטי"
              className="styled-input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="last-name">
            <input
              type="text"
              placeholder="שם משפחה"
              className="styled-input"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <div className="id">
            <input
              type="text"
              placeholder="תעודת זהות"
              className="styled-input"
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
          </div>
          <div className="phone">
            <input
              type="tel"
              placeholder="טלפון"
              className="styled-input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
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
          הירשם
        </button>
        {pendingAccount && (
          <p style={{ color: "red" }}>אימייל לא מורשה להרשם למערכת</p>
        )}
        {accountExists && <p style={{ color: "green" }}>משתמש נוצר, נא לאמת אימייל דרך התיבת דואר</p>}
      </form>
    </div>
  );
}

export default RegistrationForm;
