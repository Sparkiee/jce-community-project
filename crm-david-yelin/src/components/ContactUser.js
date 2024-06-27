import React, { useState } from "react";
import "../styles/ContactUser.css";
import "../styles/Styles.css";
import { Alert } from "@mui/material";
import { db } from "../firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

function ContactUser(props) {
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");

  const [warning, setWarning] = useState(false);
  const [contactSubmitted, setContactSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (!subject || !description) {
      setWarning(true);
      return;
    }
    try {
        const docRef = await addDoc(collection(db, "contact_log"), {
            subject: subject,
            description: description,
            notes: notes,
            timestamp: serverTimestamp(),
            srcMember: "members/" + props.source.email,
            destMember: "members/" + props.target.email,
        });
        setContactSubmitted(true);
        setTimeout(() => {
            setContactSubmitted(false);
            props.onClose();
        }, 3000);
        console.log("Document written with ID: ", docRef.id);
    } catch (e) {
        console.error("Error adding document: ", e);
    }
  }
  console.log(props)

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
        <h2 className="title extra-registration-form-title">תעד פניה חדשה</h2>
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
            value={notes}
            onChange={(event) => {
                setNotes(event.target.value);
                setWarning(false);
            }}
          />
        </div>
        {warning && <Alert className="feedback-alert feedback-contactuser" severity="warning">נא למלא את כל השדות</Alert>}
        {contactSubmitted && <Alert className="feedback-alert feedback-contactuser" severity="success">תיעוד הושלם בהצלחה</Alert>}
        <button type="submit" className="primary-button extra-reg">
          שלח פניה
        </button>
      </form>
    </div>
  );
}
export default ContactUser;
