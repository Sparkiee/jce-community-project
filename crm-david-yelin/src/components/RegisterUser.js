import { React, useState, useEffect } from "react";
import { getDoc, doc, serverTimestamp, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { auth } from "../firebase.js";
import "../styles/RegisterUser.css";
import PhoneInput from "react-phone-number-input/input";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import IconButton from "@mui/material/IconButton";

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

function RegisterUser() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyPassword, setVerifyPassword] = useState("");
  const [formWarning, setFormWarning] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [pendingAccount, setPendingAccount] = useState(false);
  const [accountExists, setAccountExists] = useState(false);
  const [passwordLength, setPasswordLength] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleClickShowPasswordConfirm = () => {
    setShowPasswordConfirm(!showPasswordConfirm);
  };

  useEffect(() => {
    const session = sessionStorage.getItem("user");
    if (session !== null && session.privileges > 0) {
      navigate("/home");
    }
    const user = localStorage.getItem("user");
    if (user !== null && session.privileges > 0) {
      navigate("/home");
    }
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!firstName || !lastName || !phone || !email || !password || !verifyPassword) {
      // fields are empty
      setFormWarning(true);
      return;
    }
    if (phone.length !== 13) {
      setPhoneError(true);
      return;
    }
    if (password !== verifyPassword) {
      setPasswordsMatch(false);
      return;
    }
    if (password.length < 6) {
      setPasswordLength(true);
      return;
    }
    try {
      const isPendingRegistration = await checkPendingRegistration(email.toLowerCase());
      setPendingAccount(!isPendingRegistration);
      if (isPendingRegistration) {
        const userDepartment = await grabDepartment(email);

        try {
          const docRef = doc(db, "members", email);
          await setDoc(docRef, {
            email: email,
            firstName: firstName,
            lastName: lastName,
            fullName: firstName + " " + lastName,
            phone: phone,
            privileges: 1,
            adminAccess: [],
            department: userDepartment,
            role: await grabRole(email),
            createdOn: serverTimestamp(),
          });
          setAccountExists(true);

          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await sendEmailVerification(user);
          // Delete the document from the awaiting_registration collection
          const awaitingRegistrationDocRef = doc(db, "awaiting_registration", email);
          await deleteDoc(awaitingRegistrationDocRef);
        } catch (e) {
          console.error("Error writing document: ", e);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }

  function resetWarnings() {
    setFormWarning(false);
    setPasswordsMatch(true);
    setPendingAccount(false);
    setAccountExists(false);
    setPasswordLength(false);
    setPhoneError(false);
  }

  return (
    <div className="container">
      <div className="registration-style">
        <a href="/" className="back-home">
          → חזרה להתחברות
        </a>
        <div className="forms-box">
          <div className="login-logo">
            <img className="login-logo-img" src={require("../assets/aguda.png")} alt="aguda icon" />
            <p>
              אגודת הסטודנטים <br /> והסטודנטיות דוד ילין
            </p>
          </div>
        </div>
        <form className="registration-form" onSubmit={handleSubmit}>
          <h2 className="title extra-registration-form-title">הרשמה</h2>
          <div className="registration-input-box">
            <input
              type="text"
              placeholder="שם פרטי"
              className="forms-input"
              value={firstName}
              onChange={(event) => {
                setFirstName(event.target.value);
                resetWarnings();
              }}
            />
            <input
              type="text"
              placeholder="שם משפחה"
              className="forms-input"
              value={lastName}
              onChange={(event) => {
                setLastName(event.target.value);
                resetWarnings();
              }}
            />
            <PhoneInput
              defaultCountry="IL"
              placeholder="טלפון"
              className="forms-input"
              maxLength="12"
              value={phone}
              onChange={(value) => {
                setPhone(value);
                resetWarnings();
              }}
              style={{ textAlign: "right" }}
            />
            <input
              type="email"
              placeholder="אימייל"
              className="forms-input"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                resetWarnings();
              }}
            />
            <div className="show-password-input-container">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="סיסמה"
                className="forms-input"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  resetWarnings();
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
            <div className="show-password-input-container">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                placeholder="אמת סיסמה"
                className="forms-input"
                value={verifyPassword}
                onChange={(event) => {
                  setVerifyPassword(event.target.value);
                  resetWarnings();
                }}
              />
              <div className="password-icon-container">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPasswordConfirm}
                  edge="end"
                  className="visibility-icon">
                  {showPasswordConfirm ? <VisibilityOffIcon /> : <VisibilityIcon />}
                </IconButton>
              </div>
            </div>
          </div>
          <button type="submit" className="primary-button extra-reg">
            הירשם
          </button>
          <div className="feedback-registration">
            {formWarning && (
              <Alert className="feedback-alert" severity="error">
                אנא מלא את כל השדות
              </Alert>
            )}
            {pendingAccount && (
              <Alert className="feedback-alert" severity="error">
                אימייל לא מורשה להרשם למערכת
              </Alert>
            )}
            {accountExists && (
              <Alert className="feedback-alert" severity="info">
                משתמש נוצר, נא לאמת אימייל דרך התיבת דואר
              </Alert>
            )}
            {!passwordsMatch && (
              <Alert className="feedback-alert" severity="warning">
                הסיסמאות אינן תואמות
              </Alert>
            )}
            {passwordLength && (
              <Alert className="feedback-alert" severity="warning">
                הסיסמה צריכה להכיל לפחות 6 תווים
              </Alert>
            )}
            {phoneError && (
              <Alert className="feedback-alert" severity="warning">
                מספר הטלפון אינו תקין
              </Alert>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default RegisterUser;
