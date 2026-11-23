import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import GoogleSheetsModal from "./GoogleSheetsModal";
import {
  LayoutDashboard,
  UploadCloud,
  FileSpreadsheet,
  Clock,
  Layers,
  FileCheck2,
  LogOut,
  FolderOpen,
  Users
} from "lucide-react";

export default function Sidebar() {
  const { user, isAdmin, isDepartment, logout } = useAuth();
  const { sidebarOpen, closeSidebar } = useSidebar();
  const [showSheetsModal, setShowSheetsModal] = useState(false);

  const handleNavClick = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768 && closeSidebar) {
      closeSidebar();
    }
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={closeSidebar}
          aria-label="Close navigation sidebar"
        />
      )}
      <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"}`}>
        <div className="sidebar-section-title">
          {isAdmin ? "ADMINISTRATION" : `${user?.department?.toUpperCase()} SECTION`}
        </div>

        <nav className="sidebar-nav">
          {isAdmin ? (
            <>
              <NavLink
                to="/admin/dashboard"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/upload"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <UploadCloud size={18} />
                <span>Upload Document</span>
              </NavLink>

              <NavLink
                to="/admin/communications"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <FileSpreadsheet size={18} />
                <span>All Communications</span>
              </NavLink>

              <NavLink
                to="/admin/pending"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Clock size={18} />
                <span>Pending Works</span>
              </NavLink>

              <NavLink
                to="/admin/departments"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Layers size={18} />
                <span>Departments</span>
              </NavLink>

              <NavLink
                to="/admin/user-profiles"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Users size={18} />
                <span>User Profiles</span>
              </NavLink>
            </>
          ) : (
            <>
              <NavLink
                to="/department/dashboard"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/department/pending"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <Clock size={18} />
                <span>Pending Works</span>
              </NavLink>

              <NavLink
                to="/department/communications"
                onClick={handleNavClick}
                className={({ isActive }) => `sidebar-link ${isActive ? "active" : ""}`}
              >
                <FolderOpen size={18} />
                <span>All My Communications</span>
              </NavLink>
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <div
            className="storage-indicator clickable-indicator"
            onClick={() => setShowSheetsModal(true)}
            title="Click to view Google Sheets Live Register details & setup"
          >
            <div className="indicator-title">
              <span className="live-dot"></span> Central Data Register
            </div>
            <div className="indicator-sub">Google Sheets &bull; Google Drive</div>
          </div>

          <button onClick={logout} className="sidebar-logout-btn">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>

        {showSheetsModal && (
          <GoogleSheetsModal onClose={() => setShowSheetsModal(false)} />
        )}
      </aside>
    </>
  );
}
