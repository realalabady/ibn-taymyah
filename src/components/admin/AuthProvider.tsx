"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/client";
import { refreshContent } from "@/app/actions";

type AuthState =
  | { status: "loading" }
  | { status: "signed-out" }
  | { status: "not-admin"; user: User }
  | { status: "admin"; user: User };

const AuthContext = createContext<AuthState>({ status: "loading" });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    return onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ status: "signed-out" });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        setState(snap.exists() ? { status: "admin", user } : { status: "not-admin", user });
      } catch {
        setState({ status: "not-admin", user });
      }
    });
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useAdminUser(): User {
  const state = useAuth();
  if (state.status !== "admin") throw new Error("useAdminUser must be used inside an admin-only screen");
  return state.user;
}

export async function logout() {
  await signOut(auth);
}

// Tell the public site to drop its cached copy so the change shows immediately.
export async function publishChanges(user: User) {
  const token = await user.getIdToken();
  return refreshContent(token);
}
