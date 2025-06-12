// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCATjuZ6o54hp-P84lnS6n_o9dGyFH1_8g",
    authDomain: "mindmap-ad6dd.firebaseapp.com",
    projectId: "mindmap-ad6dd",
    storageBucket: "mindmap-ad6dd.firebasestorage.app",
    messagingSenderId: "882676772255",
    appId: "1:882676772255:web:dcb692696274d65ab261aa",
    measurementId: "G-N7T0R2DJ2S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

export { auth, googleProvider, facebookProvider, signInWithPopup };
