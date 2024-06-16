import { useState, useEffect } from "react";
import { db } from "../firebase";
import { getDoc, doc, serverTimestamp, setDoc, getDocs, collection } from "firebase/firestore";
import "../styles/UserCreationForm.css";
import DepartmentSelect from "./Selectors/DepartmentSelect";

const checkPendingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

// Add current department as a field in pending_registration and later on connect to user
function UserCreationForm() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [department, setDepartment] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const isPendingRegistration = await checkPendingRegistration(email.toLowerCase());
      if (isPendingRegistration) {
        setEmailExists(true);
        return;
      } else {
        setEmailExists(false);
        // Add email to pending registration
        const docRef = doc(db, "awaiting_registration", email);
        await setDoc(docRef, {
          email: email,
          department: department,
          role: role,
          timestamp: serverTimestamp(),
        });
        setAccountCreated(true);
      }
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  return (
    <div className="container">
      <div className="forms-box">
        <h2 className="title">יצירת משתמש</h2>
        <form className="extra-create-user-form" onSubmit={handleSubmit}>
          <div className="create-user-form">
            <div className="create-user-input-box">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="אימייל"
                className="forms-input"
              />
              <DepartmentSelect department={department} setDepartment={setDepartment} />
              <input
                type="text"
                value={role}
                onChange={(event) => setRole(event.target.value)}
                placeholder="תפקיד"
                className="forms-input"></input>
            </div>
            <button type="submit" className="primary-button">
              צור משתמש חדש
            </button>
            <div className="feedback">
              {emailExists && <p>אימייל כבר קיים במערכת</p>}
              {accountCreated && <p style={{ color: "green" }}>המשתמש נוצר בהצלחה</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserCreationForm;
