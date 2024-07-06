import React, { useState } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import "../styles/CreateDepartment.css";

function DepartmentForm({ onClose, onComplete }) {
  const [departmentName, setDepartmentName] = useState("");

  const handleAddDepartment = async () => {
    const docRef = doc(db, "departments", departmentName);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      try {
        await setDoc(docRef, { name: departmentName });
        onComplete(departmentName);
      } catch (e) {
        console.error("Error adding document: ", e);
      }
    } else {
      alert("Department already exists");
    }
  };

  return (
    <div className="create-department-form-style">
      <div className="action-close" onClick={onClose}>
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
      <div className="create-department-container-input">
        <h1 className="create-department-title">הוספת מחלקה חדשה</h1>
        <input
          type="text"
          value={departmentName}
          onChange={(e) => setDepartmentName(e.target.value)}
          placeholder="שם המחלקה"
          className="forms-input"
        />
        <button onClick={handleAddDepartment} className="primary-button">
          הוסף מחלקה
        </button>
      </div>
    </div>
  );
}

export default DepartmentForm;
