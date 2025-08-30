// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBQdlG6bEGYIoR_WGzBVCB5V5UHvwC4N3A",
  authDomain: "patitas-salvajes.firebaseapp.com",
  projectId: "patitas-salvajes",
  storageBucket: "patitas-salvajes.firebasestorage.app",
  messagingSenderId: "862527621880",
  appId: "1:862527621880:web:17a26cd5f26e4b1909490d",
  measurementId: "G-44TYF6VMME"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
