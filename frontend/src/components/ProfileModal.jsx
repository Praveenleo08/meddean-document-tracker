import React, { useState } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  UserCircle,
  Building,
  Lock,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  Tag,
  ShieldAlert,
  Info
} from "lucide-react";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.profileName || user?.name || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen || !user) return null;

  const accountName = user.accountName || `${user.department} Dept`;
  const username = user.username;
  const isCollege = user.category === "College" || user.department?.startsWith("College");

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setErrorMsg("Profile name cannot be blank.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await api.put("/auth/profile", { profileName: profileName.trim() });
      if (res.data?.success && res.data?.user) {
        if (updateUserProfile) {
          updateUserProfile(res.data.user);
        }
        setSuccessMsg("Profile display name successfully updated!");
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.data?.error || "Failed to update profile name.");
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.error || err.message || "Failed to update profile name.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container profile-settings-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-subtle text-blue">
              <UserCircle size={24} />
            </div>
            <div>
              <h2 className="modal-title">Account & Profile Settings</h2>
              <p className="modal-subtitle">
                Customize your personal profile display name and view official institutional account details.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {successMsg && (
            <div className="alert alert-success mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-error mb-4 flex items-center gap-2">
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Official Account Identifier (Read-Only / Main) */}
          <div className="account-details-box mb-5">
            <div className="account-box-header">
              <div className="flex items-center gap-2">
                <Building size={16} className="text-navy" />
                <span className="font-bold text-sm text-navy">Main Account Name</span>
              </div>
              <span className="lock-badge-pill">
                <Lock size={12} /> Locked (Main Identifier)
              </span>
            </div>

            <div className="account-name-display">
              <span className="account-name-text">{accountName}</span>
            </div>

            <div className="account-notice-note">
              <Info size={13} className="notice-icon" />
              <span>
                <strong>{accountName}</strong> is the central institutional department name registered on Google Drive, Google Sheets, and correspondence. It cannot be altered by section users. Only the Dean Admin has authorization to change account names.
              </span>
            </div>

            <div className="account-meta-grid">
              <div className="meta-item">
                <span className="meta-lbl">System Username:</span>
                <span className="meta-val font-mono">{username}</span>
              </div>
              <div className="meta-item">
                <span className="meta-lbl">Section Category:</span>
                <span className={`meta-val badge-pill ${isCollege ? "badge-college" : "badge-hospital"}`}>
                  {user.category || (isCollege ? "College Section" : "Hospital Section")}
                </span>
              </div>
            </div>

            {user.title && (
              <div className="meta-work-desc mt-2">
                <span className="meta-lbl">Assigned Duties / Portfolio:</span>
                <p className="text-xs text-muted mt-0.5">{user.title}</p>
              </div>
            )}
          </div>

          {/* Section 2: Editable Profile Name */}
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="form-group mb-4">
              <label className="form-label font-bold flex items-center justify-between" htmlFor="profile-name-input">
                <span>Profile Name (Display Name)</span>
                <span className="text-xs font-normal text-emerald flex items-center gap-1">
                  <Tag size={12} /> Customizable
                </span>
              </label>

              <input
                id="profile-name-input"
                type="text"
                className="form-input form-input-lg"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="e.g. hospital - s5 or Officer In-Charge"
                autoFocus
                required
              />

              <p className="text-xs text-muted mt-1.5 leading-relaxed">
                This display name appears on your navigation bar, dashboard greeting, document reviews, and remarks timeline. Example: <em>hospital - s5</em>.
              </p>
            </div>

            {/* Modal Actions */}
            <div className="modal-footer flex items-center justify-end gap-3 pt-3 border-t">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                <Save size={16} />
                <span>{loading ? "Saving..." : "Save Profile Name"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
