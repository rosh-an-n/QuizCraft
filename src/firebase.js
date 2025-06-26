// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC3p5-ntachZttRDXLf69kYY4QuH3oyxuk",
  authDomain: "quizapp-551e9.firebaseapp.com",
  projectId: "quizapp-551e9",
  storageBucket: "quizapp-551e9.firebasestorage.app",
  messagingSenderId: "184629958297",
  appId: "1:184629958297:web:bd58937be8e272d70c0a08",
  measurementId: "G-0ZW0HY40L3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };