import "../styles/Styles.css";
import "../styles/ContactUser.css";

import React, { useState } from "react";
import { Alert } from "@mui/material";
import { db } from "../firebase";
import { setDoc, doc } from "firebase/firestore";

function EditContactLog(props) {
  const [subject, setSubject] = useState(props.target.subject || "");
  const [description, setDescription] = useState(
    props.target.description || ""
  );
  const [notes, setNotes] = useState(props.target.notes || "");

  const [warning, setWarning] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!subject || !description) {
      setWarning(true);
      return;
    }
    try {
      const docRef = await doc(db, "contact_log", props.target.logDoc);
      setDoc(docRef, {
        subject: subject,
        description: description,
        notes: notes,
        timestamp: props.target.timestamp,
        srcMember: props.target.srcMember,
        destMember: props.target.destMember,
      });
      setContactSubmitted(true);
      setTimeout(() => {
        setContactSubmitted(false);
        props.onClose();
      }, 1000);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  return (
    <div className="contact-user">
      <div className="action-close" onClick={props.onClose}>
        <svg
          width="24px"
          height="24px"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
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
      <form className="contact-user-form" onSubmit={handleSubmit}>
        <h2 className="title extra-registration-form-title">
          עדכן תיעוד לפניה קיימת
        </h2>
        <div className="contact-user-input-box">
          <input
            type="text"
            className="forms-input"
            placeholder="נושא פניה"
            value={subject}
            onChange={(event) => {
              setSubject(event.target.value);
              setWarning(false);
            }}
          />
          <textarea
            type="text"
            className="forms-input text-area"
            placeholder="תיאור פניה"
            maxLength={46}
            rows={3}
            value={description}
            onChange={(event) => {
              setDescription(event.target.value);
              setWarning(false);
            }}
          />
          <input
            type="text"
            className="forms-input"
            placeholder="הערות (אופציונאלי)"
            maxLength={46}
            value={notes}
            onChange={(event) => {
              setNotes(event.target.value);
              setWarning(false);
            }}
          />
        </div>
        {warning && (
          <Alert
            className="feedback-alert feedback-contactuser"
            severity="warning"
          >
            נא למלא את כל השדות
          </Alert>
        )}
        {contactSubmitted && (
          <Alert
            className="feedback-alert feedback-contactuser"
            severity="success"
          >
            תיעוד עודכן בהצלחה
          </Alert>
        )}
        <button type="submit" className="primary-button extra-reg">
          עדכן פניה
        </button>
      </form>
    </div>
  );
}
export default EditContactLog;
