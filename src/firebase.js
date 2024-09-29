import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyC9GyoK1awbasziSECCUNELVsSCJfuqDkQ",
  authDomain: "familymanagementapp-7da5b.firebaseapp.com",
  projectId: "familymanagementapp-7da5b",
  storageBucket: "familymanagementapp-7da5b.appspot.com",
  messagingSenderId: "54290888726",
  appId: "1:54290888726:web:831637ad62bec220569d37",
  measurementId: "G-03NHY1LB7K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const firestore = getFirestore(app);