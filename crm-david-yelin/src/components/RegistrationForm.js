import { React, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDoc,
  doc,
  serverTimestamp,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "../firebase.js";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification
} from "firebase/auth";
import { auth } from "../firebase.js";
import "../styles/RegistrationForm.css";
import PhoneInput from "react-phone-number-input/input";

const checkPendingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

const grabDepartment = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().department;
  }
  return null;
};

const grabRole = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data().role;
  }
  return null;
};

function RegistrationForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");

  const [pendingAccount, setPendingAccount] = useState(false);
  const [accountExists, setAccountExists] = useState(false);

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      const isPendingRegistration = await checkPendingRegistration(
        email.toLowerCase()
      );
      setPendingAccount(!isPendingRegistration);
      if (isPendingRegistration) {

        await grabDepartment(email)

        try {
          console.log("Writing document...");
          const docRef = doc(db, "members", email);
          await setDoc(docRef, {
            email: email,
            firstName: firstName,
            lastName: lastName,
            fullName: firstName + " " + lastName,
            phone: phone,
            privileges: 1,
            department: await grabDepartment(email),
            role: await grabRole(email),
            createdOn: serverTimestamp()
          });
          console.log("Document successfully written!");
          setAccountExists(true);

          const userCredential = await createUserWithEmailAndPassword(
            auth,
            email,
            password
          );
          const user = userCredential.user;
          console.log(`User registered with UID: ${user.uid}`);
          await sendEmailVerification(user);
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
            navigate("/");
          }, 5000);
        } catch (e) {
          console.error("Error writing document: ", e);
          setAccountExists(false);
        }
      }
    } catch (e) {}
    // Handle form submission
  }
  const passwordsMatch = password === verifyPassword;

  return (
    <div className="container">
      <div className="registration">
        <h2 className="title">הרשמה</h2>
        <form className="registration-form" onSubmit={handleSubmit}>
          <div className="registration-input-box">
            <input
              type="text"
              placeholder="שם פרטי"
              className="registration-input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <input
              type="text"
              placeholder="שם משפחה"
              className="registration-input"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
            <PhoneInput
              defaultCountry="IL"
              placeholder="טלפון"
              className="registration-input"
              value={phone}
              onChange={setPhone}
              style={{ textAlign: "right" }}
            />
            <input
              type="email"
              placeholder="אימייל"
              className="registration-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            <input
              type="password"
              placeholder="סיסמה"
              className="registration-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
            <input
              type="password"
              placeholder="אמת סיסמה"
              className="registration-input"
              value={verifyPassword}
              onChange={(event) => setVerifyPassword(event.target.value)}
            />
          </div>
          <button type="submit" className="registration-form-button">
            הירשם
          </button>
          <div className="feedback">
            {pendingAccount && <p>אימייל לא מורשה להרשם למערכת</p>}
            {accountExists && (
              <p style={{ color: "green" }}>
                משתמש נוצר, נא לאמת אימייל דרך התיבת דואר
              </p>
            )}
            {!passwordsMatch && <p>הסיסמאות אינן תואמות</p>}
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegistrationForm;
