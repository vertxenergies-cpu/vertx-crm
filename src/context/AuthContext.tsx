"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { User, Role, Permission } from "@/types";
import { INITIAL_USERS, ROLES_CONFIG } from "@/lib/constants";

export type AuthStatus =
  | "INITIALIZING"
  | "AUTHENTICATED_LOADING_PROFILE"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "PROFILE_ERROR";

interface AuthContextType {
  status: AuthStatus;
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  profileError: string | null;
  loading: boolean;
  role: Role | null;
  isSuperAdmin: boolean;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
  getIdToken: () => Promise<string | null>;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, name: string, role?: Role) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPassword: string) => Promise<void>;
  allUsers: User[];
}

const AuthContext = createContext<AuthContextType>({
  status: "INITIALIZING",
  firebaseUser: null,
  currentUser: null,
  profileError: null,
  loading: true,
  role: null,
  isSuperAdmin: false,
  permissions: [],
  hasPermission: () => false,
  getIdToken: async () => null,
  signIn: async () => {},
  signUp: async () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
  changePassword: async () => {},
  allUsers: [],
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>("INITIALIZING");
  const [profileError, setProfileError] = useState<string | null>(null);
  const [isSuperAdminClaim, setIsSuperAdminClaim] = useState<boolean>(false);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // 1. Single Auth State Listener - Initialized ONCE on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setFirebaseUser(null);
        setCurrentUser(null);
        setIsSuperAdminClaim(false);
        setProfileError(null);
        setStatus("UNAUTHENTICATED");
        return;
      }

      setStatus("AUTHENTICATED_LOADING_PROFILE");
      setProfileError(null);

      try {
        const idToken = await user.getIdToken();
        let res = await fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });

        let data = await res.json();

        // If profile was just created on registration and not saved in db.json yet, wait 800ms and retry once
        if (!res.ok && data?.code === "PROFILE_NOT_FOUND") {
          await new Promise((resolve) => setTimeout(resolve, 800));
          res = await fetch("/api/auth/me", {
            headers: {
              Authorization: `Bearer ${idToken}`,
            },
          });
          data = await res.json();
        }

        if (!res.ok || !data.success || !data.data) {
          throw new Error(
            data.error ||
              "Your account is authenticated, but your VERTX ENERGIES employee profile could not be found. Please contact the administrator."
          );
        }

        const profile: User = data.data;

        // Check custom claims and Super Admin status
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const hasSuper =
            tokenResult.claims.superAdmin === true ||
            profile.superAdmin === true ||
            profile.role === "SUPER_ADMIN" ||
            user.email?.toLowerCase() === "vertxenergies@gmail.com";

          setIsSuperAdminClaim(hasSuper);
          if (hasSuper) {
            profile.superAdmin = true;
            profile.role = "SUPER_ADMIN";
            profile.roleId = "SUPER_ADMIN";
          }
        } catch (claimErr) {
          console.warn("Notice checking custom claims:", claimErr);
        }

        setCurrentUser(profile);
        setStatus("AUTHENTICATED");
      } catch (err: any) {
        console.error("AuthContext fetchAuthenticatedProfile error:", err);
        setCurrentUser(null);
        setProfileError(err.message || "Failed to load employee profile.");
        setStatus("PROFILE_ERROR");
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch team members list for dropdowns (does NOT alter auth identity)
  useEffect(() => {
    fetch("/api/team")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) {
          setAllUsers(data.data);
        }
      })
      .catch((err) => console.error("Error loading team list:", err));
  }, []);

  // Retrieve Firebase ID Token for authenticated API calls
  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (firebaseUser) {
      try {
        return await firebaseUser.getIdToken();
      } catch (err) {
        console.error("Failed to get Firebase ID token:", err);
      }
    }
    return null;
  }, [firebaseUser]);

  // Sign In with Email & Password
  const signIn = async (email: string, pass: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (err: any) {
      const lowerEmail = email.trim().toLowerCase();
      const matchingInitial = INITIAL_USERS.find((u) => u.email.toLowerCase() === lowerEmail);
      const isValidTempPass = pass === "123456" || pass === "TempPass@2026" || pass === "password123";

      if (matchingInitial && isValidTempPass) {
        try {
          await createUserWithEmailAndPassword(auth, email, pass);
          return;
        } catch (createErr) {
          console.warn("Auto-provision error during sign in:", createErr);
        }
      }
      throw err;
    }
  };

  // Sign Up / Register Employee
  const signUp = async (email: string, pass: string, name: string, userRole: Role = "SALES_EXECUTIVE") => {
    const safeRole = userRole === "SUPER_ADMIN" ? "SALES_EXECUTIVE" : userRole;
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  // Sign In with Google Workspace
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(auth, provider);
  };

  // Sign Out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (err) {
      console.warn("Firebase sign out warning:", err);
    }
    setFirebaseUser(null);
    setCurrentUser(null);
    setProfileError(null);
    setStatus("UNAUTHENTICATED");
    if (typeof window !== "undefined") {
      localStorage.clear();
      sessionStorage.clear();
    }
  };

  // Reset Password
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Change Password in Firebase Auth Root & Backend
  const changePassword = async (newPassword: string) => {
    if (!firebaseUser) {
      throw new Error("No active Firebase Authentication session found.");
    }

    if (newPassword.length < 6) {
      throw new Error("Password must be at least 6 characters long.");
    }

    // 1. Reflect in Firebase Auth Client SDK (Updates Firebase Root User)
    try {
      await updatePassword(firebaseUser, newPassword);
    } catch (clientErr: any) {
      console.warn("Notice updating Firebase Client SDK password directly:", clientErr?.message);
      if (clientErr?.code === "auth/requires-recent-login") {
        throw new Error("For security reasons, changing your password requires recent sign-in. Please sign out and log in again.");
      }
    }

    // 2. Synchronize with Backend & Admin SDK
    const res = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uid: firebaseUser.uid,
        newPassword,
      }),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to save password update on server.");
    }

    if (currentUser) {
      currentUser.mustChangePassword = false;
    }
  };

  const loading = status === "INITIALIZING" || status === "AUTHENTICATED_LOADING_PROFILE";
  const role: Role | null = currentUser?.role || (currentUser?.roleId as Role) || null;
  const isSuperAdmin = isSuperAdminClaim || currentUser?.superAdmin === true || role === "SUPER_ADMIN";
  const permissions: Permission[] = role && ROLES_CONFIG[role] ? ROLES_CONFIG[role].permissions : [];
  const hasPermission = useCallback((permission: Permission) => isSuperAdmin || permissions.includes(permission), [isSuperAdmin, permissions]);

  return (
    <AuthContext.Provider
      value={{
        status,
        firebaseUser,
        currentUser,
        profileError,
        loading,
        role,
        isSuperAdmin,
        permissions,
        hasPermission,
        getIdToken,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        resetPassword,
        changePassword,
        allUsers,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
