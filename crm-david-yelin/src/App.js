import logo from './logo.svg';
import './App.css';

import { useEffect } from 'react';

// Firebase imports
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";


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

const members = collection(db, 'member');


function App() {
  useEffect(() => {
    const printDocuments = async () => {
      const querySnapshot = await getDocs(members);
      querySnapshot.forEach((doc) => {
        console.log(`${doc.id} => ${JSON.stringify(doc.data())}`);
      });
    };

    printDocuments();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
