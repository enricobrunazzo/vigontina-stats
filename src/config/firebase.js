// config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyC1Dw0zFBOYwW6uVfEa0zHC5YBOFUhHsmI",
  authDomain: "vigontina-stats.firebaseapp.com",
  projectId: "vigontina-stats",
  storageBucket: "vigontina-stats.firebasestorage.app",
  messagingSenderId: "979551248607",
  appId: "1:979551248607:web:fb9b3092d79507ddaf896a",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firestore
export const db = getFirestore(app);

export default app;