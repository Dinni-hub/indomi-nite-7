import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDgpgvxBgUbeD1jGS3rPKzzfgzxclx960s",
  authDomain: "indomi-nite.firebaseapp.com",
  databaseURL: "https://indomi-nite-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "indomi-nite",
  storageBucket: "indomi-nite.firebasestorage.app",
  messagingSenderId: "74730525314",
  appId: "1:74730525314:web:cc76b5cd6ba3c31fe9da9b",
  measurementId: "G-CWVEQV4B4X"
};

const app = initializeApp(firebaseConfig);
console.log("Firebase initialized with project:", firebaseConfig.projectId);
export const database = getDatabase(app);
export const analytics = getAnalytics(app);
