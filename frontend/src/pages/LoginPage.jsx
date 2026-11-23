import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, LogIn, AlertCircle, Building2, ChevronDown } from "lucide-react";
import { COLLEGE_SECTIONS, HOSPITAL_SECTIONS } from "../config/departments";

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

  const handleQuickSelectSection = (e) => {
    const selectedUsername = e.target.value;
    if (!selectedUsername) return;
    setUsername(selectedUsername);
    setPassword("Dean@123");
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
              placeholder="e.g. admin, college_e1, hospital_e1_1"
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
              placeholder="Enter password (default: Dean@123)"
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

        {/* Institutional Accounts Quick Selector */}
        <div className="demo-accounts-panel">
          <div className="demo-panel-title">
            <ShieldCheck size={14} /> Quick-Select Institutional Account (1-Click Fill)
          </div>

          <div className="demo-chips-grid">
            <button
              type="button"
              className="demo-chip chip-admin"
              onClick={() => handleDemoFill("admin", "Admin@123")}
            >
              <span className="chip-role">DEAN ADMIN</span>
              <span className="chip-user">admin</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("college_e1", "Dean@123")}
            >
              <span className="chip-role">COLLEGE E1</span>
              <span className="chip-user">college_e1</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("college_cash", "Dean@123")}
            >
              <span className="chip-role">COLLEGE CASH</span>
              <span className="chip-user">college_cash</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("hospital_e1_1", "Dean@123")}
            >
              <span className="chip-role">HOSPITAL E1</span>
              <span className="chip-user">hospital_e1_1</span>
            </button>

            <button
              type="button"
              className="demo-chip chip-dept"
              onClick={() => handleDemoFill("hospital_a1", "Dean@123")}
            >
              <span className="chip-role">HOSPITAL A1</span>
              <span className="chip-user">hospital_a1</span>
            </button>
          </div>

          {/* All 49 Sections Quick Dropdown */}
          <div style={{ marginTop: "12px" }}>
            <label className="text-xs text-muted block mb-1 font-medium">
              Or pick from all 49 College & Hospital Sections:
            </label>
            <select
              className="form-select text-xs"
              onChange={handleQuickSelectSection}
              value=""
            >
              <option value="" disabled>-- Select Section to Auto-Fill Login --</option>
              <optgroup label="COLLEGE SECTIONS (24)" className="optgroup-header optgroup-college">
                {COLLEGE_SECTIONS.map((sec) => (
                  <option key={sec.username} value={sec.username}>
                    {sec.name} ({sec.username})
                  </option>
                ))}
              </optgroup>
              <optgroup label="HOSPITAL SECTIONS (25)" className="optgroup-header optgroup-hospital">
                {HOSPITAL_SECTIONS.map((sec) => (
                  <option key={sec.username} value={sec.username}>
                    {sec.name} ({sec.username})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <div style={{ marginTop: "8px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
            Default Section Password: <strong style={{ color: "#0284c7" }}>Dean@123</strong> &bull; Admin Password: <strong style={{ color: "#0284c7" }}>Admin@123</strong>
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
