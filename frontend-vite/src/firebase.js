// src/firebase.js

import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrER-gpaiGWiG964jfP4BBounWek--gC0",
  authDomain: "resume-optimiser-d5c73.firebaseapp.com",
  projectId: "resume-optimiser-d5c73",
  storageBucket: "resume-optimiser-d5c73.appspot.com",
  messagingSenderId: "106399088341",
  appId: "1:106399088341:web:8f04e99c85aa19d86dec5c",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
