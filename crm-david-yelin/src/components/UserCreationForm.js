import { useState, useEffect } from 'react';
import { db } from "../firebase";
import { getDoc, doc, serverTimestamp, setDoc} from "firebase/firestore";

const checkPendingRegistration = async (email) => {
    const docRef = doc(db, "awaiting_registration", email);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
}

function UserCreationForm() {
    const [email, setEmail] = useState('');
    const [emailExists, setEmailExists] = useState(false);
    const [accountCreated, setAccountCreated] = useState(false);

    useEffect(() => {
        let timer;
        if (accountCreated) {
            timer = setTimeout(() => {
                setAccountCreated(false);
            }, 5000); // Change back to false after 5 seconds
        }
        return () => clearTimeout(timer); // This will clear the timeout if the component unmounts before the timeout finishes
    }, [accountCreated]);

    async function handleSubmit(event) {
        event.preventDefault();
        
        try {
            const isPendingRegistration = await checkPendingRegistration(email.toLowerCase());
            if(isPendingRegistration) {
                setEmailExists(true);
                return;
            }
            else {
                setEmailExists(false);
                // Add email to pending registration
                const docRef = doc(db, "awaiting_registration", email);
                await setDoc(docRef, {
                    email: email,
                    timestamp: serverTimestamp()
                });
                setAccountCreated(true);
            }
            
        } catch(e) {
            console.error("Error adding document: ", e)
        }
    }
    return (
      <div className="creation">
        <h2 className="title">יצירת משתמש</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-box">
            <div className="email">
              <input type="email" value={email} onChange={(event)=> setEmail(event.target.value)} placeholder="אימייל" className="styled-input"/>
            </div>
          </div>
          <button type="submit" className="styled-button">יצירה</button>
          {emailExists && <p style={{color: 'red'}}>אימייל כבר קיים במערכת</p>}
          {accountCreated && <p style={{color: 'green'}}>המשתמש נוצר בהצלחה</p>}
          
        </form>
      </div>
    );
  }
  
  export default UserCreationForm;