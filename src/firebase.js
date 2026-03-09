// src/firebase.js

// Import the necessary functions from Firebase v9+ modular SDK
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Your Firebase config object from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyB40gAFxWXkLYZc2UnbWEnxpTWimiboJSQ",
  authDomain: "froog-9de9e.firebaseapp.com",
  projectId: "froog-9de9e",
  storageBucket: "froog-9de9e.firebasestorage.app",
  messagingSenderId: "152890006578",
  appId: "1:152890006578:web:808fd583a52491db05b02b",
  measurementId: "G-8X0T6E8J5Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db, doc, getDoc, setDoc, updateDoc, increment };