import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useSidebar } from "../context/SidebarContext";
import ProfileModal from "./ProfileModal";
import {
  LogOut,
  UserCircle,
  FileText,
  PanelLeftClose,
  PanelLeft,
  Settings,
  ChevronDown
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { sidebarOpen, toggleSidebar } = useSidebar();
  const [showProfileModal, setShowProfileModal] = useState(false);

  const displayName = user?.profileName || user?.name || user?.username || "Officer";
  const accountDisplayName = user?.accountName || (user?.role === "admin" ? "Dean Office Admin" : `${user?.department} Dept`);

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
            {/* Clickable Profile Badge */}
            <button
              type="button"
              className="user-profile-badge user-profile-clickable"
              onClick={() => setShowProfileModal(true)}
              title="Click to edit profile display name"
              aria-label="Edit profile display name"
            >
              <UserCircle size={22} className="user-avatar-icon" />
              <div className="user-details text-left">
                <span className="user-name">
                  {displayName}
                </span>
                <span className="user-role-dept">
                  {accountDisplayName}
                </span>
              </div>
              <ChevronDown size={14} className="user-menu-chevron" />
            </button>

            <button
              onClick={logout}
              className="btn btn-secondary btn-sm logout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>

            {/* Profile Settings Modal */}
            <ProfileModal
              isOpen={showProfileModal}
              onClose={() => setShowProfileModal(false)}
            />
          </>
        )}
      </div>
    </header>
  );
}
