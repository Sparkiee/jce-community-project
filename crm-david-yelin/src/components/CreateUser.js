import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase";
import { getDoc, doc, serverTimestamp, setDoc, getDocs, collection } from "firebase/firestore";
import "../styles/CreateUser.css";
import "../styles/Styles.css";
import Alert from "@mui/material/Alert";

const checkPendingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

const checkExistingAccount = async (email) => {
  const docRef = doc(db, "members", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

// Add current department as a field in pending_registration and later on connect to user
function CreateUser(props) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [emailPendingRegistration, setEmailPendingRegistration] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [department, setDepartment] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");
  const [missingFields, setMissingFields] = useState(false);

  let navigate = useNavigate();

  function addDepartment() {
    if (newDepartment && !departmentList.includes(newDepartment)) {
      setDepartmentList([...departmentList, newDepartment]);
      setDepartment(newDepartment);
      try {
        const docRef = doc(db, "departments", newDepartment);
        setDoc(docRef, {
          name: newDepartment,
        });
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    }
    setIsOtherSelected(false);
    setDepartment(newDepartment);
    setNewDepartment("");
  }

  useEffect(() => {
    let timer;
    if (accountCreated) {
      timer = setTimeout(() => {
        setAccountCreated(false);
      }, 5000); // Change back to false after 5 seconds
    }
    return () => clearTimeout(timer); // This will clear the timeout if the component unmounts before the timeout finishes
  }, [accountCreated]);

  // grab departments from firebase
  useEffect(() => {
    async function fetchDepartments() {
      try {
        const querySnapshot = await getDocs(collection(db, "departments"));
        const departments = querySnapshot.docs.map((doc) => doc.data().name);
        setDepartmentList(departments);
      } catch (e) {
        console.error("Error fetching departments: ", e);
      }
    }

    fetchDepartments();
  }, []); // Empty dependency array means this effect runs once on mount

  async function handleSubmit(event) {
    event.preventDefault();
    if (!email || !department || !role) {
      setMissingFields(true);
      setTimeout(() => {
        setMissingFields(false);
      }, 3000);
      return;
    }
    try {
      const isPendingRegistration = await checkPendingRegistration(email.toLowerCase());
      const isExistingAccount = await checkExistingAccount(email.toLowerCase());
      if (isPendingRegistration) {
        setEmailPendingRegistration(true);
        setTimeout(() => {
          setEmailPendingRegistration(false);
        }, 2000);
        return;
      }
      if (isExistingAccount) {
        setEmailExists(true);
        setTimeout(() => {
          setEmailExists(false);
        }, 2000);
        return;
      }
      setEmailPendingRegistration(false);
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
      setTimeout(() => {
        setAccountCreated(false);
        props.onClose();
      }, 2000);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
  return (
    <div className="user-creation-style media-style">
      <div className="action-close" onClick={props.onClose}>
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor">
          <line
            x1="17"
            y1="7"
            x2="7"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="7"
            y1="7"
            x2="17"
            y2="17"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>
      <form className="extra-create-user-form media-form" onSubmit={handleSubmit}>
        <div className="create-user-form">
          <h2 className="title extra-create-user-form-title">יצירת משתמש חדש</h2>
          <div className="create-user-input-box">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="אימייל"
              className="forms-input"
            />
            <select
              name="department"
              value={department}
              onChange={(event) => {
                const value = event.target.value;
                if (value === "other") {
                  setIsOtherSelected(true);
                  setDepartment("");
                } else {
                  setIsOtherSelected(false);
                  setDepartment(value);
                }
              }}
              className="forms-input">
              <option value="" disabled>
                בחר מחלקה
              </option>
              {departmentList.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
              <option value="other">הוסף מחלקה חדשה</option>
            </select>
            {isOtherSelected && (
              <div className="new-department">
                <input
                  type="text"
                  value={newDepartment}
                  placeholder="שם מחלקה חדשה"
                  onChange={(event) => setNewDepartment(event.target.value)}
                  className="forms-input"
                />
                <button
                  type="button"
                  onClick={addDepartment}
                  className="primary-button extra-create-user-button">
                  הוסף מחלקה חדשה
                </button>
              </div>
            )}
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
        </div>
      </form>
      <div className="feedback-create-user">
        {emailPendingRegistration && (
          <Alert className="feedback-alert" severity="error">
            אימייל כבר מחכה להרשמה
          </Alert>
        )}
        {emailExists && (
          <Alert className="feedback-alert" severity="error">
            אימייל כבר קיים במערכת
          </Alert>
        )}
        {accountCreated && (
          <Alert className="feedback-alert" severity="success">
            המשתמש נוצר בהצלחה
          </Alert>
        )}
        {missingFields && (
          <Alert className="feedback-alert" severity="error">
            נא למלא את כל השדות!
          </Alert>
        )}
      </div>
    </div>
  );
}

export default CreateUser;
