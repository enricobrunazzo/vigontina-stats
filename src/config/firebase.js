// config/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyC1Dw0zFBOYwW6uVfEa0zHC5YBOFUhHsmI",
  authDomain: "vigontina-stats.firebaseapp.com",
  databaseURL: "https://vigontina-stats-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "vigontina-stats",
  storageBucket: "vigontina-stats.firebasestorage.app",
  messagingSenderId: "979551248607",
  appId: "1:979551248607:web:fb9b3092d79507ddaf896a",
};

// Inizializza Firebase
const app = initializeApp(firebaseConfig);

// Inizializza Firestore (per dati storici)
export const db = getFirestore(app);

// Inizializza Realtime Database (per partite attive)
export const realtimeDb = getDatabase(app);

// Debug: verifica connessione
if (typeof window !== 'undefined') {
  console.log('Firebase Realtime Database configurato:', firebaseConfig.databaseURL);
}

export default app;