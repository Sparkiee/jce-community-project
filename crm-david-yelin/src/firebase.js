// firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAo4Lu5WoZHpYfBWNziKIDWwaTdXGOWElY",
    authDomain: "jce-community-project.firebaseapp.com",
    projectId: "jce-community-project",
    storageBucket: "jce-community-project.appspot.com",
    messagingSenderId: "259479438956",
    appId: "1:259479438956:web:2bdc03b272bbaf137e7a49",
    measurementId: "G-TBZFFQJJY0"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export {db};