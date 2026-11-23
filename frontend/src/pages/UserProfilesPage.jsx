import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  Users,
  Search,
  RefreshCw,
  Edit,
  Key,
  Lock,
  Building2,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ShieldAlert,
  Eye,
  EyeOff
} from "lucide-react";

export default function UserProfilesPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all"); // 'all' | 'College' | 'Hospital' | 'Dean'
  const [editingUser, setEditingUser] = useState(null);

  // Form states for Dean edit modal
  const [editAccountName, setEditAccountName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/auth/users");
      if (res.data?.success && res.data?.users) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error("Error loading user profiles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditAccountName(u.accountName || `${u.department} Dept`);
    setEditUsername(u.username);
    setEditPassword("");
    setEditTitle(u.title || "");
    setShowPassword(false);
    setSaveError("");
    setSaveSuccess("");
  };

  const closeEditModal = () => {
    setEditingUser(null);
    setSaveError("");
    setSaveSuccess("");
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editAccountName.trim()) {
      setSaveError("Account Name cannot be empty.");
      return;
    }
    if (!editUsername.trim()) {
      setSaveError("Username cannot be empty.");
      return;
    }

    setSaveLoading(true);
    setSaveError("");
    setSaveSuccess("");

    try {
      const payload = {
        accountName: editAccountName.trim(),
        username: editUsername.trim().toLowerCase(),
        title: editTitle.trim()
      };

      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await api.put(`/auth/users/${editingUser.id}`, payload);
      if (res.data?.success) {
        setSaveSuccess("Account credentials updated successfully!");
        fetchUsers();
        setTimeout(() => {
          closeEditModal();
        }, 1000);
      } else {
        setSaveError(res.data?.error || "Failed to update account.");
      }
    } catch (err) {
      setSaveError(err.response?.data?.error || err.message || "Failed to update account.");
    } finally {
      setSaveLoading(false);
    }
  };

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (categoryFilter !== "all" && u.category !== categoryFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.accountName && u.accountName.toLowerCase().includes(q)) ||
      (u.department && u.department.toLowerCase().includes(q)) ||
      (u.title && u.title.toLowerCase().includes(q))
    );
  });

  const collegeCount = users.filter((u) => u.category === "College").length;
  const hospitalCount = users.filter((u) => u.category === "Hospital").length;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Users size={26} className="text-blue" />
            Institutional User Profiles & Account Control
          </h1>
          <p className="page-subtitle">
            Dean Administrative Panel: Manage official account names, login credentials, and passwords across all college and hospital sections.
          </p>
        </div>

        <div className="page-actions">
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={fetchUsers}
            title="Refresh user list"
          >
            <RefreshCw size={15} />
            <span>Refresh Accounts</span>
          </button>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="kpi-grid mb-6">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Active Accounts</span>
            <div className="kpi-icon-wrap icon-blue">
              <Users size={20} />
            </div>
          </div>
          <div className="kpi-value text-blue">{users.length}</div>
          <div className="kpi-footer">1 Dean Admin + 49 Sections</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">College Sections</span>
            <div className="kpi-icon-wrap icon-indigo">
              <Building2 size={20} />
            </div>
          </div>
          <div className="kpi-value text-indigo">{collegeCount || 24}</div>
          <div className="kpi-footer">Dean, Faculty & Student Sections</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Hospital Sections</span>
            <div className="kpi-icon-wrap icon-emerald">
              <Building2 size={20} />
            </div>
          </div>
          <div className="kpi-value text-emerald">{hospitalCount || 25}</div>
          <div className="kpi-footer">Clinical, Nursing & Store Sections</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Authority Level</span>
            <div className="kpi-icon-wrap icon-amber">
              <ShieldAlert size={20} />
            </div>
          </div>
          <div className="kpi-value text-amber font-mono text-xl">Dean Exclusive</div>
          <div className="kpi-footer">Only Dean can alter accounts & passwords</div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="dept-filter-controls mb-5">
        <div className="category-tabs-wrap">
          <button
            type="button"
            className={`tab-pill ${categoryFilter === "all" ? "active" : ""}`}
            onClick={() => setCategoryFilter("all")}
          >
            All Accounts ({users.length})
          </button>
          <button
            type="button"
            className={`tab-pill tab-college ${categoryFilter === "College" ? "active" : ""}`}
            onClick={() => setCategoryFilter("College")}
          >
            College Sections ({collegeCount})
          </button>
          <button
            type="button"
            className={`tab-pill tab-hospital ${categoryFilter === "Hospital" ? "active" : ""}`}
            onClick={() => setCategoryFilter("Hospital")}
          >
            Hospital Sections ({hospitalCount})
          </button>
        </div>

        <div className="search-input-wrap max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input form-input-search"
            placeholder="Search account name or username..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchQuery("")}
            >
              &times;
            </button>
          )}
        </div>
      </div>

      {/* Accounts Control Table */}
      <div className="content-card">
        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "80px", textAlign: "center" }}>Code</th>
                <th style={{ minWidth: "250px" }}>Account Name (Main)</th>
                <th style={{ width: "160px" }}>Login Username</th>
                <th style={{ width: "140px", textAlign: "center" }}>Category</th>
                <th style={{ minWidth: "220px" }}>Work Portfolio</th>
                <th style={{ width: "140px", textAlign: "center" }}>Password Status</th>
                <th style={{ width: "100px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    <RefreshCw size={24} className="animate-spin text-blue mb-2" />
                    <div>Loading institutional accounts database...</div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="empty-table-cell">
                    <div>No accounts match "{searchQuery}".</div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isCollege = u.category === "College";
                  const isAdmin = u.role === "admin";
                  return (
                    <tr key={u.id} className={isAdmin ? "bg-amber-subtle" : ""}>
                      <td className="font-mono text-xs font-bold text-muted text-center">
                        {u.code || u.id}
                      </td>
                      <td>
                        <span className="font-bold text-navy flex items-center gap-2">
                          <Building2 size={15} className={isCollege ? "text-blue flex-shrink-0" : "text-emerald flex-shrink-0"} />
                          <span>{u.accountName || `${u.department} Dept`}</span>
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-xs bg-slate-100 px-2 py-1 rounded border font-semibold text-blue-700 inline-block">
                          {u.username}
                        </span>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          className={`badge-pill text-xs inline-block ${
                            isAdmin
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : isCollege
                              ? "badge-college"
                              : "badge-hospital"
                          }`}
                        >
                          {u.category || (isAdmin ? "Dean Admin" : "Section")}
                        </span>
                      </td>
                      <td className="text-xs text-muted leading-snug">
                        {u.title || "Institutional Duties"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {u.customPasswordSet ? (
                          <span className="text-xs font-semibold text-emerald inline-flex items-center gap-1 justify-center">
                            <Key size={12} /> Custom Set
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-slate-500 inline-flex items-center gap-1 justify-center">
                            <Key size={12} /> {isAdmin ? "Admin@123" : "Dean@123"}
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm flex items-center gap-1 mx-auto"
                          onClick={() => openEditModal(u)}
                          title="Dean: Control Account Name, Username & Password"
                        >
                          <Edit size={13} />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dean Edit Account Modal (Fixed Popup) */}
      {editingUser && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div
            className="modal-container dean-control-modal"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="modal-header">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-amber-subtle text-amber">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="modal-title">Dean Account & Password Control</h2>
                    <span className="badge-pill bg-amber-100 text-amber-800 border-amber-300 text-xs font-bold">
                      DEAN ONLY
                    </span>
                  </div>
                  <p className="modal-subtitle">
                    Modify official Account Name, Login Username, and Password for{" "}
                    <strong>{editingUser.accountName || editingUser.department}</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={closeEditModal}
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="modal-body">
              {saveSuccess && (
                <div className="alert alert-success mb-4 flex items-center gap-2">
                  <CheckCircle2 size={18} />
                  <span>{saveSuccess}</span>
                </div>
              )}

              {saveError && (
                <div className="alert alert-error mb-4 flex items-center gap-2">
                  <AlertCircle size={18} />
                  <span>{saveError}</span>
                </div>
              )}

              <form onSubmit={handleSaveUser} className="space-y-4">
                {/* 1. Account Name (Main) */}
                <div className="form-group mb-3">
                  <label className="form-label font-bold flex items-center justify-between" htmlFor="dean-account-name">
                    <span>Account Name (Main System Identifier)</span>
                    <span className="text-xs text-amber font-semibold flex items-center gap-1">
                      <Lock size={12} /> Dean Privilege
                    </span>
                  </label>
                  <input
                    id="dean-account-name"
                    type="text"
                    className="form-input"
                    value={editAccountName}
                    onChange={(e) => setEditAccountName(e.target.value)}
                    placeholder="e.g. Hospital - S5 Dept"
                    required
                  />
                  <p className="text-xs text-muted mt-1">
                    Primary department name displayed on official registers and document workflows.
                  </p>
                </div>

                {/* 2. Login Username */}
                <div className="form-group mb-3">
                  <label className="form-label font-bold" htmlFor="dean-username">
                    System Login Username
                  </label>
                  <input
                    id="dean-username"
                    type="text"
                    className="form-input font-mono"
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="e.g. hospital_s5"
                    required
                  />
                  <p className="text-xs text-muted mt-1">
                    Unique credential used by the department/section to sign in.
                  </p>
                </div>

                {/* 3. Password Control (Dean Only) */}
                <div className="form-group mb-3 p-3 bg-slate-50 border rounded-lg">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="form-label font-bold mb-0 flex items-center gap-1.5" htmlFor="dean-password">
                      <Key size={14} className="text-blue" />
                      <span>Change or Reset Password</span>
                    </label>
                    <button
                      type="button"
                      className="btn-text-action text-xs font-semibold text-blue"
                      onClick={() => setEditPassword("Dean@123")}
                    >
                      Fill Default (Dean@123)
                    </button>
                  </div>

                  <div className="relative flex items-center">
                    <input
                      id="dean-password"
                      type={showPassword ? "text" : "password"}
                      className="form-input pr-10"
                      value={editPassword}
                      onChange={(e) => setEditPassword(e.target.value)}
                      placeholder="Leave blank to keep existing password"
                    />
                    <button
                      type="button"
                      className="absolute right-3 text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex="-1"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-xs text-muted mt-1">
                    Only Dean Admin has authority to set or change account passwords.
                  </p>
                </div>

                {/* 4. Work Portfolio Description */}
                <div className="form-group mb-4">
                  <label className="form-label font-bold" htmlFor="dean-title">
                    Portfolio / Section Description
                  </label>
                  <textarea
                    id="dean-title"
                    className="form-textarea"
                    rows={2}
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder="Official responsibilities of this section"
                  />
                </div>

                {/* Actions */}
                <div className="modal-footer flex items-center justify-end gap-3 pt-3 border-t">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={closeEditModal}
                    disabled={saveLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={saveLoading}
                  >
                    <Save size={16} />
                    <span>{saveLoading ? "Saving Changes..." : "Save Account & Password"}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
