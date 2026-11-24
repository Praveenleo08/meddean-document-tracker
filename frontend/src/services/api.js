import axios from "axios";
import { auth } from "../config/firebase";

const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000
});

// Request interceptor to attach Firebase ID token
api.interceptors.request.use(
  async (config) => {
    try {
      let token = null;
      if (auth.currentUser) {
        token = await auth.currentUser.getIdToken();
        localStorage.setItem("meddean_token", token);
      } else {
        token = localStorage.getItem("meddean_token");
      }

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      const fallbackToken = localStorage.getItem("meddean_token");
      if (fallbackToken) {
        config.headers.Authorization = `Bearer ${fallbackToken}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle 401/403
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("meddean_token");
      localStorage.removeItem("meddean_user");
      // Don't redirect if already on login page
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
