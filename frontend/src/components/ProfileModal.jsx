import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  UserCircle,
  CheckCircle2,
  AlertCircle,
  X,
  Save
} from "lucide-react";

export default function ProfileModal({ isOpen, onClose }) {
  const { user, updateUserProfile } = useAuth();
  const [profileName, setProfileName] = useState(user?.profileName || user?.name || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen && user) {
      setProfileName(user.profileName || user.name || "");
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

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
        setSuccessMsg("Profile name updated successfully!");
        setTimeout(() => {
          onClose();
        }, 900);
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
        style={{ maxWidth: "440px" }}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-blue-subtle text-blue">
              <UserCircle size={22} />
            </div>
            <div>
              <h2 className="modal-title">Edit Profile Name</h2>
              <p className="modal-subtitle">
                Update your personal display name
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

          {/* Profile Name Edit Form */}
          <form onSubmit={handleSave} className="profile-edit-form">
            <div className="form-group mb-4">
              <label className="form-label font-bold" htmlFor="profile-name-input">
                Profile Name
              </label>

              <input
                id="profile-name-input"
                type="text"
                className="form-input form-input-lg"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                placeholder="Enter profile display name"
                autoFocus
                required
              />
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
                <span>{loading ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
