import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogIn,
  AlertCircle,
  Building2,
  Eye,
  EyeOff
} from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username || !password) {
      setErrorMsg("Please enter both username and password.");
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      if (res.user.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/department/dashboard");
      }
    } else {
      setErrorMsg(res.error || "Invalid username or password.");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        {/* Institutional Header */}
        <div className="login-header">
          <div className="institution-seal">
            <Building2 size={36} />
          </div>
          <h1 className="login-title">MedDean Document Tracker</h1>
          <p className="login-subtitle">
            Intelligent Administrative Communication & Pending Work Management System
          </p>
          <div className="college-dean-tag">Medical College Dean's Office</div>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label className="form-label" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="form-input password-input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            <LogIn size={18} />
            <span>{loading ? "Authenticating..." : "Sign In"}</span>
          </button>
        </form>

        <div className="login-footer">
          <div className="architecture-note">
            Google Drive Document Repository &bull; Google Sheets Central Live Register
          </div>
        </div>
      </div>
    </div>
  );
}
