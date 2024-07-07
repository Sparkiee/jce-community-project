import React, { useState, useEffect, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Alert from "@mui/material/Alert";
import "../styles/CreateDepartment.css";

function CreateDepartment({ onClose, onComplete }) {
  const [departmentName, setDepartmentName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const formRef = useRef(null);

  const handleAddDepartment = async () => {
    if (departmentName.trim() === "") {
      setError("שם המחלקה הוא שדה חובה");
      setTimeout(() => setError(""), 2000);
      return;
    }

    const docRef = doc(db, "departments", departmentName);
    const docSnapshot = await getDoc(docRef);
    if (!docSnapshot.exists()) {
      try {
        await setDoc(docRef, { name: departmentName });
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onComplete(departmentName);
        }, 2000);
      } catch (e) {
        console.error("Error adding document: ", e);
        setError("שגיאה בהוספת מחלקה");
        setTimeout(() => setError(""), 2000);
      }
    } else {
      setError("המחלקה כבר קיימת");
      setTimeout(() => setError(""), 2000);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (formRef.current && !formRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

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
      <div className="create-department-container-input" ref={formRef}>
        <h1 className="create-department-title">הוספת מחלקה חדשה</h1>
        <input
          type="text"
          value={departmentName}
          onChange={(e) => {
            setDepartmentName(e.target.value);
            if (e.target.value.trim() !== "") {
              setError("");
            }
          }}
          placeholder="שם המחלקה (חובה*)"
          className="forms-input"
        />
        <button onClick={handleAddDepartment} className="primary-button">
          הוסף מחלקה
        </button>
      </div>
      <div className="create-department-messages">
        {success && (
          <Alert className="feedback-alert" severity="success">
            המחלקה נוספה בהצלחה!
          </Alert>
        )}
        {error && (
          <Alert className="feedback-alert" severity="error">
            {error}
          </Alert>
        )}
      </div>
    </div>
  );
}

export default CreateDepartment;
