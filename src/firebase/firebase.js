// import { initializeApp, getApps, getApp } from "firebase/app";
// import { getFirestore } from "firebase/firestore";
// import storage from '@react-native-firebase/storage';
// import { initializeAuth, getAuth, getReactNativePersistence } from "firebase/auth";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// // Firebase yapılandırman
// const firebaseConfig = {
//   apiKey: "AIzaSyAW4GlBt6jpcaBrAVsuGHVZX6dsEoxFLjM",
//   authDomain: "educam-492e8.firebaseapp.com",
//   projectId: "educam-492e8",
//   storageBucket: "educam-492e8.appspot.com",
//   messagingSenderId: "964230873872",
//   appId: "1:964230873872:web:a7f19b357c0c25e4a19b95",
//   measurementId: "G-D8E0R59XFV"
// };

// // 🔥 Firebase App başlatılıyor (eğer zaten başlatılmamışsa)
// const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// // 🔥 Auth başlatılıyor
// let auth;
// try {
//   auth = initializeAuth(app, {
//     persistence: getReactNativePersistence(AsyncStorage)
//   });
// } catch (e) {
//   // Eğer zaten initialize edilmişse getAuth ile yakala
//   auth = getAuth(app);
// }

// // Firestore ve Storage
// const db = getFirestore(app);

// export { db, auth, storage };
// export default app;

// firebase.js
import { firebase } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export { firebase, auth, firestore, storage };

