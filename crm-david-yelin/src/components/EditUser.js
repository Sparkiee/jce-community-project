import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../firebase.js";

import "../styles/RegistrationForm.css";

function EditUser() {
  const [firstName, setFirstName] = useState(""); // replace with current user's firstName
  const [lastName, setLastName] = useState(""); // replace with current user's lastName
  const [id, setId] = useState(""); // replace with current user's id
  const [phone, setPhone] = useState(""); // replace with current user's phone

  const navigate = useNavigate();

  async function handleSubmit(event) {
    event.preventDefault();
    try {
      console.log("Updating document...");
      const docRef = doc(db, "members", id);
      await setDoc(docRef, {
        firstName: firstName,
        lastName: lastName,
        fullName: firstName + " " + lastName,
        id: id,
        phone: phone,
        updatedOn: serverTimestamp()
      }, { merge: true });
      console.log("Document successfully updated!");
      // Navigate to user profile page or wherever you want
      setTimeout(() => {
        navigate('/profile');
      }, 5000);
    } catch (e) {
      console.error("Error updating document: ", e);
    }
  }

  return (
    <div className="registration">
      <h2 className="title">עריכת משתמש</h2>
      <form onSubmit={handleSubmit}>
        <div className="input-box">
          <div className="first-name">
            <input
              type="text"
              placeholder="שם פרטי"
              className="styled-input"
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
          </div>
          <div className="last-name">
            <input
              type="text"
              placeholder="שם משפחה"
              className="styled-input"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
          </div>
          <div className="id">
            <input
              type="text"
              placeholder="תעודת זהות"
              className="styled-input"
              value={id}
              onChange={(event) => setId(event.target.value)}
            />
          </div>
          <div className="phone">
            <input
              type="tel"
              placeholder="טלפון"
              className="styled-input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>
          <div>
            <input
              type="email"
              placeholder="אימייל"
              className="styled-input"
            />
            <select className='privileges'>
                <option value='user'>משתמש לא באגודה</option>
                <option value='member'>חבר אגודה</option>
                <option value='department-head'>ראש מחלקה</option>
                <option value='chairman'>יושב ראש האגודה</option>
            </select>
          </div>
        </div>
        <button type="submit" className="styled-button">
          עדכן
        </button>
      </form>
    </div>
  );
}

export default EditUser;