import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  doc,
  serverTimestamp,
  setDoc,
  getDocs,
  collection,
  where,
  query
} from "firebase/firestore";
import { db } from "../firebase.js";
import "../styles/Styles.css";
import "../styles/EditUser.css";
import TextField from "@mui/material/TextField";
import PhoneInput from "react-phone-number-input/input";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import { Alert } from "@mui/material";

function EditUser(params) {
  const [firstName, setFirstName] = useState(params.target.firstName);
  const [lastName, setLastName] = useState(params.target.lastName);
  const [email, setEmail] = useState(params.target.email);
  const [phone, setPhone] = useState(params.target.phone);
  const [role, setRole] = useState(params.target.role);
  const [department, setDepartment] = useState(params.target.department);
  const [privileges, setPrivileges] = useState(params.target.privileges);

  const [departmentList, setDepartmentList] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);
  const [newDepartment, setNewDepartment] = useState("");

  const [isNoLevel3, setIsNoLevel3] = useState(false);
  const [edittedSuccessfully, setEdittedSuccessfully] = useState(false);

  let navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    console.log("submitting form");

    if (params.target.privileges > 2 && privileges !== 3) {
      console.log("here");

      // Reference to the Firestore "members" collection
      const memberRef = collection(db, "members");

      // Construct the query
      const q = query(memberRef, where("privileges", ">", 2));

      // Fetch the documents matching the query
      const querySnapshot = await getDocs(q);

      // Check if the query snapshot is empty
      if (querySnapshot.empty) {
        console.log("none");
      } else {
        querySnapshot.forEach((doc) => {
          console.log(doc.id, " => ", doc.data());
        });

        console.log(querySnapshot.size);

        // Check if there is only one document with level 3 privileges
        if (querySnapshot.size === 1) {
          setIsNoLevel3(true);
          setTimeout(() => {
            setIsNoLevel3(false);
          }, 3000);
          return;
        }
      }
    }
    const docRef = doc(db, "members", email);
    try {
      setDoc(docRef, {
        firstName: firstName,
        lastName: lastName,
        fullName: `${firstName} ${lastName}`,
        email: email,
        phone: phone,
        role: role,
        department: department,
        privileges: privileges,
        lastUpdate: serverTimestamp()
      });
      setEdittedSuccessfully(true);
      setTimeout(() => {
        setEdittedSuccessfully(false);
      }, 3000);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
    navigate("/users");
  }

  function addDepartment() {
    if (newDepartment && !departmentList.includes(newDepartment)) {
      setDepartmentList([...departmentList, newDepartment]);
      setDepartment(newDepartment);
      try {
        const docRef = doc(db, "departments", newDepartment);
        setDoc(docRef, {
          name: newDepartment
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
  }, []);

  return (
    <div className="edit-user">
      <form className="edit-user-form" onSubmit={handleSubmit}>
        <h2 className="title extra-registration-form-title">
          עריכת משתמש, {params.target.firstName} {params.target.lastName}
        </h2>
        <div className="registration-input-box">
          <input
            type="text"
            placeholder="שם פרטי"
            className="forms-input"
            value={firstName}
            onChange={(event) => {
              setFirstName(event.target.value);
              console.log(event.target.value);
            }}
          />
          <input
            type="text"
            placeholder="שם משפחה"
            className="forms-input"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
          <PhoneInput
            defaultCountry="IL"
            placeholder="טלפון"
            className="forms-input"
            maxLength="12"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            style={{ textAlign: "right" }}
          />
          <input
            readOnly
            type="email"
            placeholder="אימייל"
            className="forms-input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
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
            className="forms-input"
          >
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
                className="primary-button extra-create-user-button"
              >
                הוסף מחלקה חדשה
              </button>
            </div>
          )}
          <input
            type="text"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="תפקיד"
            className="forms-input"
          />
          <select
            value={privileges}
            onChange={(event) => setPrivileges(Number(event.target.value))}
            className="forms-input"
          >
            <option value={3}>יו"ר</option>
            <option value={2}>ראש מחלקה</option>
            <option value={1}>חבר מועצה</option>
            <option value={0}>משתמש מושהה</option>
          </select>
          {isNoLevel3 && (
            <Alert
              severity="warning"
              className="feedback-alert feedback-edituser"
            >
              חייב להיות לפחות משתמש יו"ר אחד במערכת לפני הורדת הרשאות
            </Alert>
          )}
          {edittedSuccessfully && (
            <Alert
              severity="success"
              className="feedback-alert feedback-edituser"
            >
              פרטי המשתמש עודכנו בהצלחה
            </Alert>
          )}
          <button type="submit" className="primary-button extra-reg">
            עדכן פרטים
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditUser;
