import React, { useState } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc } from "firebase/firestore";


// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAo4Lu5WoZHpYfBWNziKIDWwaTdXGOWElY",
  authDomain: "jce-community-project.firebaseapp.com",
  projectId: "jce-community-project",
  storageBucket: "jce-community-project.appspot.com",
  messagingSenderId: "259479438956",
  appId: "1:259479438956:web:2bdc03b272bbaf137e7a49",
  measurementId: "G-TBZFFQJJY0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const auth = getAuth(app);
const db = getFirestore(app);

function Register() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    // Handle form submission
    try {
        await setDoc(doc(db, 'members', username), {
          username: username,
          password: password, // TODO: figure out how to hash this
          email: "test@gmail.com",
          privileges: 0,
          department: "General"
        });
        console.log(`Document written with ID: ${username}`);
      } catch (e) {
        console.error('Error adding document: ', e);
      }
  };

  return (
    <div>
      <h1>Register</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" value={username} onChange={e => setUsername(e.target.value)} required />
        </label> 
        <br />
        <label>
          Password: 
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>
        <input type="submit" value="Submit" />
      </form>
    </div>
  );
}

export default Register;