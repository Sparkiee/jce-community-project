import { useState, useEffect } from "react";
import { db } from "../firebase";
import { getDoc, doc, serverTimestamp, setDoc, getDocs, collection } from "firebase/firestore";
import "../styles/UserCreationForm.css";

const checkPendingRegistration = async (email) => {
  const docRef = doc(db, "awaiting_registration", email);
  const docSnap = await getDoc(docRef);
  return docSnap.exists();
};

function UserCreationForm() {
  const [email, setEmail] = useState("");
  const [emailExists, setEmailExists] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [department, setDepartment] = useState("");
  const [departmentList, setDepartmentList] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");

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
        const departments = querySnapshot.docs.map(doc => doc.data().name);
        setDepartmentList(departments);
      } catch (e) {
        console.error("Error fetching departments: ", e);
      }
    }
  
    fetchDepartments();
  }, []); // Empty dependency array means this effect runs once on mount

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
      <div className="create-user">
        <h2 className="title">יצירת משתמש</h2>
        <form onSubmit={handleSubmit}>
          <div className="create-user-form">
            <div className="create-user-input-box">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="אימייל"
                className="create-user-input"
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
                className="create-user-input">
                <option value="" disabled>
                  בחר מחלקה
                </option>
                {departmentList.map((dept, index) => (
                  <option key={index} value={dept}>
                    {dept}
                  </option>
                ))}
                <option value="other">הוסף מחלקה</option>
              </select>
              {isOtherSelected && (
                <div className="new-department">
                  <input
                    type="text"
                    value={newDepartment}
                    placeholder="הוסף מחלקה"
                    onChange={(event) => setNewDepartment(event.target.value)}
                    className="create-user-input"
                  />
                  <button type="button" onClick={addDepartment} className="create-button">
                    הוסף מחלקה
                  </button>
                </div>
              )}
            </div>
            <button type="submit" className="create-button">
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
