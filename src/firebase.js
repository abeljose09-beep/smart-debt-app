import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAqrxLbn8gkSEiBezopl_rg8v_-37HhMmQ",
  authDomain: "smartdebt-250c5.firebaseapp.com",
  projectId: "smartdebt-250c5",
  storageBucket: "smartdebt-250c5.firebasestorage.app",
  messagingSenderId: "576686349502",
  appId: "1:576686349502:web:be719485f82fad876a12ef",
  measurementId: "G-YPZH4SVCLW"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
