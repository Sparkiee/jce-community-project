import { useState } from 'react';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase.js'; // Import Firestore instance from firebase.js

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
          department: "General",
          createdOn: serverTimestamp()
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