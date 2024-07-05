import React, { useState } from "react";

function EditDepartment(props) {
  const [department, setDepartment] = useState(props.department.name || "");

  async function handleSubmit(e) {
    e.preventDefault();
    props.onComplete(department);
  }
  
  return (
    <div className="change-password-form">
      <div
        className="action-close"
        onClick={() => {
          props.onClose();
        }}>
        <svg width="24px" height="24px" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
          <line x1="17" y1="7" x2="7" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="7" x2="17" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <form onSubmit={handleSubmit}>
        <h1 className="change-password-title">עדכון מחלקה</h1>
        <div className="change-password-input-container">
          <input
            type="input"
            placeholder="שם מחלקה"
            className="forms-input"
            value={department}
            onChange={(e) => {
              setDepartment(e.target.value);
            }}
          />
        </div>
        <button type="submit" className="primary-button">
          עדכן מחלקה
        </button>
      </form>
    </div>
  );
}
export default EditDepartment;
