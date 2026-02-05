
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCbZ6I6DXb4MJqWFFDgSnIgrPNME_kTJfM",
  authDomain: "learn-6ba55.firebaseapp.com",
  projectId: "learn-6ba55",
  storageBucket: "learn-6ba55.firebasestorage.app",
  messagingSenderId: "357009347125",
  appId: "1:357009347125:web:c9d3bd98bf12815986977c",
  measurementId: "G-0Z9D5E2PBH"
};

import { getStorage } from "firebase/storage";

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };
