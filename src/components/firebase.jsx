// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase,  ref, push } from "firebase/database"; // Import getDatabase for Realtime Database

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyChZaJ_EyldVzP0tJdkbYuTqK4MOLVlKhE",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "jobinterviewsite-b37e3.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "jobinterviewsite-b37e3",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "jobinterviewsite-b37e3.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "918060926180",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:918060926180:web:c829488df15201bf0a98f1",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-55PTKCK8R1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
const auth = getAuth(app);

// Initialize Firebase Realtime Database
const database = getDatabase(app);

const db = getDatabase(app); // Get the database instance here

export { auth, database, ref, db, push }; // Properly export both 'auth' and 'database'
