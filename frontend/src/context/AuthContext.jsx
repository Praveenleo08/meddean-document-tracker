import React, { createContext, useContext, useState, useEffect } from "react";
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

  useEffect(() => {
    if (token) {
      // Validate session with backend
      api.get("/auth/me")
        .then((res) => {
          if (res.data && res.data.user) {
            setUser(res.data.user);
            localStorage.setItem("meddean_user", JSON.stringify(res.data.user));
          }
        })
        .catch(() => {
          logout();
        });
    }
  }, [token]);

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/login", { username, password });
      if (res.data.success) {
        setToken(res.data.token);
        setUser(res.data.user);
        localStorage.setItem("meddean_token", res.data.token);
        localStorage.setItem("meddean_user", JSON.stringify(res.data.user));
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.error || "Login failed." };
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || "Invalid credentials.";
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

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("meddean_token");
    localStorage.removeItem("meddean_user");
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUserProfile,
    isAdmin: user?.role === "admin",
    isDepartment: user?.role === "department",
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
