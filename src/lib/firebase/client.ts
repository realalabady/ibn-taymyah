"use client";

import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { firebaseConfig } from "./config";

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Local testing only: `npm run dev:emulated` points the app at the Firebase emulators
// (see firebase.json), so nothing touches the real project.
if (process.env.NEXT_PUBLIC_FIREBASE_EMULATORS === "1" && !(globalThis as { __emu?: boolean }).__emu) {
  (globalThis as { __emu?: boolean }).__emu = true;
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  connectFirestoreEmulator(db, "127.0.0.1", 8080);
}
