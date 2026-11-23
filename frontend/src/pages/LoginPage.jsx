import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LogIn, AlertCircle, Building2, FileText, CheckCircle2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleDemoFill = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg("");
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
              placeholder="e.g. admin or pharmacy"
              autoFocus
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your security password"
              required
            />
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

        {/* Demo Accounts Quick-Select */}
        <div className="demo-accounts-panel">
          <div className="demo-panel-title">
            <ShieldCheck size={14} /> Development & Demo Accounts (1-Click Fill)
          </div>

          <div className="demo-chips-grid">
            <button
              type="button"
              className="demo-chip chip-admin"
              onClick={() => handleDemoFill("admin", "Admin@123")}
            >
              <span className="chip-role">ADMIN</span>
              <span className="chip-user">admin</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("pharmacy", "Pharmacy@123")}
            >
              <span className="chip-role">PHARMACY</span>
              <span className="chip-user">pharmacy</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("administration", "AdminDept@123")}
            >
              <span className="chip-role">ADMIN DEPT</span>
              <span className="chip-user">administration</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("finance", "Finance@123")}
            >
              <span className="chip-role">FINANCE</span>
              <span className="chip-user">finance</span>
            </button>
          </div>
        </div>

        <div className="login-footer">
          <div className="architecture-note">
            Google Drive Document Repository &bull; Google Sheets Central Live Register
          </div>
        </div>
      </div>
    </div>
  );
}
