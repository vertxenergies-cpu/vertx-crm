import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, Auth } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBhfVmg4C8epjGCZtF5c_Odk_sC8qlSOEU",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "kerala-solar-crm.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "kerala-solar-crm",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "kerala-solar-crm.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "20740304760",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:20740304760:web:3f3ea8958e17b0a7e0e28d",
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

auth = getAuth(app);
db = getFirestore(app);

// Connect to Firebase Emulator Suite in development if configured
if (
  process.env.NODE_ENV === "development" &&
  process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true"
) {
  try {
    // Only connect emulators if not already connected
    if (typeof window !== "undefined" && !(window as any)._firebase_emulators_connected) {
      connectAuthEmulator(auth, "http://localhost:9099", { disableWarnings: true });
      connectFirestoreEmulator(db, "localhost", 8080);
      (window as any)._firebase_emulators_connected = true;
      console.info("⚡ Connected to Firebase Local Emulator Suite (Auth: 9099, Firestore: 8080)");
    }
  } catch (err) {
    console.warn("Could not connect to Firebase emulator:", err);
  }
}

export const isDevelopmentMock =
  process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_USE_MOCK_DATA === "true";

export { app, auth, db };
