// Firebase SDK'yı içe aktar
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Firebase yapılandırman
const firebaseConfig = {
  apiKey: "AIzaSyAW4GlBt6jpcaBrAVsuGHVZX6dsEoxFLjM",
  authDomain: "educam-492e8.firebaseapp.com",
  projectId: "educam-492e8",
  storageBucket: "educam-492e8.appspot.com", // **BURADAKİ HATAYI DÜZELTTİM**
  messagingSenderId: "964230873872",
  appId: "1:964230873872:web:a7f19b357c0c25e4a19b95",
  measurementId: "G-D8E0R59XFV"
};

// Firebase başlat
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { db, auth, storage };
export default app;
