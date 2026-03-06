import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBmMSjwDB7PGO6tu7_4tqLK_fDDIa1ROAU",
  authDomain: "app-de-pase-salidas-digital.firebaseapp.com",
  projectId: "app-de-pase-salidas-digital",
  storageBucket: "app-de-pase-salidas-digital.firebasestorage.app",
  messagingSenderId: "634126596780",
  appId: "1:634126596780:web:02575600dc2fe4ef84fd09"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
