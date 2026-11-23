import React from "react";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import { LogOut, UserCircle, FileText, PanelLeftClose, PanelLeft } from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useSidebar();

  return (
    <header className="navbar">
      <div className="navbar-left">
        {user && (
          <button
            type="button"
            className="sidebar-toggle-btn"
            onClick={toggleSidebar}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-label="Toggle navigation sidebar"
          >
            {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeft size={20} />}
          </button>
        )}

        <div className="navbar-brand">
          <div className="brand-logo-container">
            <FileText className="brand-icon" size={24} />
          </div>
          <div className="brand-titles">
            <h1 className="brand-title">MedDean Document Tracker</h1>
            <p className="brand-subtitle">
              Medical College Dean's Office &bull; Administrative Register
            </p>
          </div>
        </div>
      </div>

      <div className="navbar-actions">
        {user && (
          <>
            <div className="user-profile-badge">
              <UserCircle size={18} className="user-icon" />
              <div className="user-details">
                <span className="user-name">{user.name || user.username}</span>
                <span className="user-role-dept">
                  {user.role === "admin" ? "Dean Office Admin" : `${user.department} Dept`}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm logout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
