// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase,  ref, push } from "firebase/database"; // Import getDatabase for Realtime Database

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyChZaJ_EyldVzP0tJdkbYuTqK4MOLVlKhE",
  authDomain: "jobinterviewsite-b37e3.firebaseapp.com",
  projectId: "jobinterviewsite-b37e3",
  storageBucket: "jobinterviewsite-b37e3.appspot.com", // Fixed the incorrect domain
  messagingSenderId: "918060926180",
  appId: "1:918060926180:web:c829488df15201bf0a98f1",
  measurementId: "G-55PTKCK8R1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Realtime Database
const database = getDatabase(app);

const db = getDatabase(app); // Get the database instance here

export { auth, database, ref, db, push }; // Properly export both 'auth' and 'database'
