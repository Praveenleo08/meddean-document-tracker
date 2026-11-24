import React, { createContext, useContext, useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../config/firebase";
import api from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("meddean_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem("meddean_token") || null);
  const [loading, setLoading] = useState(false);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          localStorage.setItem("meddean_token", idToken);

          // Enrich/fetch user profile from backend
          const res = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${idToken}` }
          });
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("meddean_user", JSON.stringify(res.data.user));
          }
        } catch (err) {
          console.warn("[Auth] Failed to refresh user profile from backend:", err.message);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    try {
      // Keep login screen as plain Username + Password:
      // Silently append @meddean.local in React before calling signInWithEmailAndPassword
      const cleanUsername = username.trim().toLowerCase();
      const email = cleanUsername.includes("@") ? cleanUsername : `${cleanUsername}@meddean.local`;

      // 1. Firebase Authentication (Email/Password)
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();

      setToken(idToken);
      localStorage.setItem("meddean_token", idToken);

      // 2. Fetch authenticated institutional profile from backend using Firebase ID Token
      const res = await api.get("/auth/me", {
        headers: { Authorization: `Bearer ${idToken}` }
      });

      const userProfile = res.data?.user || {
        username: cleanUsername,
        role: cleanUsername === "admin" ? "admin" : "section",
        department: "General",
        accountName: cleanUsername === "admin" ? "Dean's Office" : `${cleanUsername} Dept`
      };

      setUser(userProfile);
      localStorage.setItem("meddean_user", JSON.stringify(userProfile));

      return { success: true, user: userProfile };
    } catch (err) {
      console.error("[Auth] Login error:", err);
      let errorMsg = "Invalid username or password.";
      if (
        err.code === "auth/invalid-credential" ||
        err.code === "auth/wrong-password" ||
        err.code === "auth/user-not-found"
      ) {
        errorMsg = "Invalid username or password. Please check your credentials.";
      } else if (err.code === "auth/too-many-requests") {
        errorMsg = "Too many failed login attempts. Please wait a moment and try again.";
      } else if (err.code === "auth/network-request-failed") {
        errorMsg = "Network error. Please check your internet connection.";
      } else if (err.message) {
        errorMsg = err.message;
      }
      return { success: false, error: errorMsg };
    } finally {
      setLoading(false);
    }
  };

  const updateUserProfile = (newProfileData) => {
    setUser((prev) => {
      const updated = { ...prev, ...newProfileData };
      try {
        localStorage.setItem("meddean_user", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save user to localStorage:", e);
      }
      return updated;
    });
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn("Firebase signOut error:", e);
    }
    setUser(null);
    setToken(null);
    localStorage.removeItem("meddean_token");
    localStorage.removeItem("meddean_user");
  };

  const isAdmin = user?.role === "admin";
  const isDepartment = user?.role === "section" || user?.role === "department";

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUserProfile,
    isAdmin,
    isDepartment,
    department: user?.department || null
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
