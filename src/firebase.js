import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const firestore = getFirestore(app);

export { firestore, analytics };