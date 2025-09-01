// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdDSJvOJRR5H0RZjZ7FFH7EONycf7el2A",
  authDomain: "expense-tracker-f7e5b.firebaseapp.com",
  projectId: "expense-tracker-f7e5b",
  storageBucket: "expense-tracker-f7e5b.firebasestorage.app",
  messagingSenderId: "797321312558",
  appId: "1:797321312558:web:c6107986833a63646ae2bf",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

//Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});

//DB
export const firestore = getFirestore(app);
