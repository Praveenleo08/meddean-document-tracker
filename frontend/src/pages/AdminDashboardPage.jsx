import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import DeadlineBadge from "../components/DeadlineBadge";
import DocumentModal from "../components/DocumentModal";
import {
  FileText,
  Clock,
  CheckCircle2,
  TrendingUp,
  Upload,
  ArrowRight,
  Filter,
  Eye,
  RefreshCw,
  Search,
  Send,
  Zap,
  RotateCcw
} from "lucide-react";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    submittedForClosure: 0,
    closed: 0,
    urgent: 0
  });
  const [departmentSummary, setDepartmentSummary] = useState([]);
  const [recentDocs, setRecentDocs] = useState([]);
  const [pendingDocs, setPendingDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Table Filters
  const [pendingDeptFilter, setPendingDeptFilter] = useState("all");
  const [recentDeptFilter, setRecentDeptFilter] = useState("all");
  const [recentStatusFilter, setRecentStatusFilter] = useState("all");
  const [recentSearch, setRecentSearch] = useState("");

  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/summary");
      if (res.data.success) {
        setMetrics(res.data.metrics || {});
        setDepartmentSummary(res.data.departmentSummary || []);
        setRecentDocs(res.data.recent || []);
        setPendingDocs(res.data.pendingAll || []);
      }
    } catch (err) {
      console.error("Dashboard data load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Categorized department summary groups
  const collegeDepts = departmentSummary.filter((d) => d.department.toLowerCase().startsWith("college"));
  const hospitalDepts = departmentSummary.filter((d) => d.department.toLowerCase().startsWith("hospital"));
  const otherDepts = departmentSummary.filter((d) => !d.department.toLowerCase().startsWith("college") && !d.department.toLowerCase().startsWith("hospital"));

  // Filter pending documents in Urgent Pending table
  const filteredPendingDocs = pendingDocs.filter((doc) => {
    if (pendingDeptFilter !== "all" && doc.department.toLowerCase() !== pendingDeptFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  // Filter recent communications table
  const filteredRecentDocs = recentDocs.filter((doc) => {
    if (recentDeptFilter !== "all" && doc.department.toLowerCase() !== recentDeptFilter.toLowerCase()) {
      return false;
    }
    if (recentStatusFilter !== "all" && doc.status.toLowerCase() !== recentStatusFilter.toLowerCase()) {
      return false;
    }
    if (recentSearch.trim()) {
      const q = recentSearch.toLowerCase().trim();
      const matchRef = doc.referenceNo && doc.referenceNo.toLowerCase().includes(q);
      const matchFrom = doc.from && doc.from.toLowerCase().includes(q);
      const matchSub = doc.subject && doc.subject.toLowerCase().includes(q);
      const matchId = doc.documentId && doc.documentId.toLowerCase().includes(q);
      if (!matchRef && !matchFrom && !matchSub && !matchId) return false;
    }
    return true;
  });

  const openDepartment = (deptName, status = null) => {
    let url = `/admin/communications?department=${encodeURIComponent(deptName)}`;
    if (status) {
      url += `&status=${encodeURIComponent(status)}`;
    }
    navigate(url);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Executive Dean Dashboard</h1>
          <p className="page-subtitle">
            Central Institutional Correspondence & Department Action Register
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData} title="Refresh live records">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/upload" className="btn btn-primary btn-sm">
            <Upload size={15} />
            <span>Upload Document</span>
          </Link>
        </div>
      </div>

      {/* Top KPI Cards (6 symmetric full-width responsive cards) */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Total Registered</span>
            <div className="kpi-icon-wrap icon-blue">
              <FileText size={20} />
            </div>
          </div>
          <div className="kpi-value text-blue">{metrics.total}</div>
          <div className="kpi-footer">All College Communications</div>
        </div>

        <div
          className="kpi-card kpi-card-clickable"
          onClick={() => navigate("/admin/communications?status=Pending")}
          title="Click to view all pending letters"
        >
          <div className="kpi-header">
            <span className="kpi-title">Pending Action</span>
            <div className="kpi-icon-wrap icon-amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value text-amber">{metrics.pending}</div>
          <div className="kpi-footer">Awaiting Dept Processing &rarr;</div>
        </div>

        <div
          className="kpi-card kpi-card-clickable"
          onClick={() => navigate("/admin/communications?status=In Progress")}
          title="Click to view all in-progress letters"
        >
          <div className="kpi-header">
            <span className="kpi-title">In Progress</span>
            <div className="kpi-icon-wrap icon-indigo">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value text-indigo">{metrics.inProgress}</div>
          <div className="kpi-footer">Under Active Review &rarr;</div>
        </div>

        {/* Submitted for Dean Closure Review */}
        <div
          className="kpi-card kpi-card-clickable"
          onClick={() => navigate("/admin/communications?status=Submitted for Closure")}
          title="Click to view work submitted by departments waiting for Dean closure approval"
        >
          <div className="kpi-header">
            <span className="kpi-title">Awaiting Dean Closure</span>
            <div className="kpi-icon-wrap icon-purple">
              <Send size={20} />
            </div>
          </div>
          <div className="kpi-value text-purple">{metrics.submittedForClosure || 0}</div>
          <div className="kpi-footer">Ready for Dean Approval &rarr;</div>
        </div>

        {/* Urgent Action Required */}
        <div
          className="kpi-card kpi-card-clickable"
          onClick={() => navigate("/admin/communications?urgent=true")}
          title="Click to view urgent high-priority letters"
        >
          <div className="kpi-header">
            <span className="kpi-title">Urgent Required</span>
            <div className="kpi-icon-wrap icon-neon-red">
              <Zap size={20} />
            </div>
          </div>
          <div className="kpi-value text-neon-red">{metrics.urgent || 0}</div>
          <div className="kpi-footer">High-Priority Direct Action &rarr;</div>
        </div>

        <div
          className="kpi-card kpi-card-clickable"
          onClick={() => navigate("/admin/communications?status=Closed")}
          title="Click to view closed letters"
        >
          <div className="kpi-header">
            <span className="kpi-title">Closed Works</span>
            <div className="kpi-icon-wrap icon-emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value text-emerald">{metrics.closed}</div>
          <div className="kpi-footer">Dean Approved & Sealed &rarr;</div>
        </div>
      </div>

      {/* Main Full-Width Content: Urgent Pending Work */}
      <div className="content-card mb-6">
        <div className="card-header">
          <div className="card-title-group">
            <Clock size={18} className="text-amber" />
            <h2 className="card-title">Urgent Pending Work Across Departments</h2>
            <span className="badge-count-pill">{filteredPendingDocs.length}</span>
          </div>
          <Link to="/admin/pending" className="link-action">
            <span>View Full Pending Register</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* In-Card Filter Bar */}
        <div className="table-filter-bar">
          <div className="filter-group-inline">
            <Filter size={14} className="text-muted" />
            <label className="text-xs font-semibold text-muted">Department:</label>
            <select
              className="form-select-sm"
              value={pendingDeptFilter}
              onChange={(e) => setPendingDeptFilter(e.target.value)}
            >
              <option value="all">All Sections ({departmentSummary.length})</option>
              {collegeDepts.length > 0 && (
                <optgroup label="COLLEGE" className="optgroup-header optgroup-college">
                  {collegeDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department} {d.pending > 0 ? `(${d.pending} pending)` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {hospitalDepts.length > 0 && (
                <optgroup label="HOSPITAL" className="optgroup-header optgroup-hospital">
                  {hospitalDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department} {d.pending > 0 ? `(${d.pending} pending)` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherDepts.length > 0 && (
                <optgroup label="OTHER SECTIONS">
                  {otherDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department} {d.pending > 0 ? `(${d.pending} pending)` : ""}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          {pendingDeptFilter !== "all" && (
            <button
              type="button"
              className="btn-text-reset"
              onClick={() => setPendingDeptFilter("all")}
            >
              Reset Filter
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Doc ID</th>
                <th style={{ width: "160px" }}>Ref No</th>
                <th style={{ width: "105px" }}>Date</th>
                <th style={{ width: "140px" }}>Deadline</th>
                <th style={{ width: "150px" }}>Department</th>
                <th style={{ minWidth: "160px" }}>From / Sender</th>
                <th style={{ width: "135px" }}>Status</th>
                <th style={{ width: "85px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPendingDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    <CheckCircle2 size={24} className="text-emerald mb-1" />
                    <div>No pending communications matching criteria. All caught up!</div>
                  </td>
                </tr>
              ) : (
                filteredPendingDocs.slice(0, 7).map((doc) => (
                  <tr
                    key={doc.documentId}
                    className={doc.isUrgent ? "row-urgent-neon" : ""}
                  >
                    <td className="font-mono text-muted font-semibold">{doc.documentId}</td>
                    <td className="font-semibold text-navy">
                      {doc.isUrgent && <span className="urgent-badge-neon mr-1">⚡ URGENT</span>}
                      {doc.referenceNo || "N/A"}
                    </td>
                    <td>{doc.communicationDate}</td>
                    <td>
                      <DeadlineBadge deadlineDate={doc.deadlineDate} status={doc.status} />
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dept-pill dept-pill-interactive"
                        onClick={() => openDepartment(doc.department)}
                        title={`Click to open ${doc.department} communications`}
                      >
                        {doc.department}
                      </button>
                    </td>
                    <td className="truncate-text" title={doc.from}>{doc.from}</td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedDoc(doc)}
                        title="Open document details"
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Main Full-Width Content: Recent Communications Register */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-group">
            <FileText size={18} className="text-indigo" />
            <h2 className="card-title">Recent Communications Register</h2>
            <span className="badge-count-pill">{filteredRecentDocs.length}</span>
          </div>
          <Link to="/admin/communications" className="link-action">
            <span>Open Full Register</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="table-filter-bar table-filter-bar-flex">
          <div className="filter-group-inline">
            <Filter size={14} className="text-muted" />
            <label className="text-xs font-semibold text-muted">Dept:</label>
            <select
              className="form-select-sm"
              value={recentDeptFilter}
              onChange={(e) => setRecentDeptFilter(e.target.value)}
            >
              <option value="all">All Sections ({departmentSummary.length})</option>
              {collegeDepts.length > 0 && (
                <optgroup label="COLLEGE" className="optgroup-header optgroup-college">
                  {collegeDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department}
                    </option>
                  ))}
                </optgroup>
              )}
              {hospitalDepts.length > 0 && (
                <optgroup label="HOSPITAL" className="optgroup-header optgroup-hospital">
                  {hospitalDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department}
                    </option>
                  ))}
                </optgroup>
              )}
              {otherDepts.length > 0 && (
                <optgroup label="OTHER SECTIONS">
                  {otherDepts.map((d) => (
                    <option key={d.department} value={d.department}>
                      {d.department}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>

          <div className="filter-group-inline">
            <label className="text-xs font-semibold text-muted">Status:</label>
            <select
              className="form-select-sm"
              value={recentStatusFilter}
              onChange={(e) => setRecentStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted for Closure">Submitted for Closure</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div className="search-inline-wrap">
            <Search size={14} className="search-icon-inline" />
            <input
              type="text"
              className="form-input-sm"
              placeholder="Quick search ref / sender / subject..."
              value={recentSearch}
              onChange={(e) => setRecentSearch(e.target.value)}
            />
            {recentSearch && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setRecentSearch("")}
                style={{ right: "8px", top: "50%", transform: "translateY(-50%)" }}
              >
                &times;
              </button>
            )}
          </div>

          {(recentDeptFilter !== "all" || recentStatusFilter !== "all" || recentSearch) && (
            <button
              type="button"
              className="btn-text-reset"
              onClick={() => {
                setRecentDeptFilter("all");
                setRecentStatusFilter("all");
                setRecentSearch("");
              }}
            >
              <RotateCcw size={12} style={{ display: "inline", marginRight: "4px" }} />
              Reset
            </button>
          )}
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "160px" }}>Ref No</th>
                <th style={{ width: "105px" }}>Date</th>
                <th style={{ width: "140px" }}>Deadline</th>
                <th style={{ minWidth: "150px" }}>From / Sender</th>
                <th style={{ minWidth: "220px" }}>Subject</th>
                <th style={{ width: "150px" }}>Department</th>
                <th style={{ width: "135px" }}>Status</th>
                <th style={{ width: "85px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecentDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    No communications found matching the current filters.
                  </td>
                </tr>
              ) : (
                filteredRecentDocs.slice(0, 8).map((doc) => (
                  <tr
                    key={doc.documentId}
                    className={doc.isUrgent ? "row-urgent-neon" : ""}
                  >
                    <td className="font-semibold text-navy">
                      {doc.isUrgent && <span className="urgent-badge-neon mr-1">⚡ URGENT</span>}
                      {doc.referenceNo || "N/A"}
                    </td>
                    <td>{doc.communicationDate}</td>
                    <td>
                      <DeadlineBadge deadlineDate={doc.deadlineDate} status={doc.status} />
                    </td>
                    <td className="truncate-text" title={doc.from}>{doc.from}</td>
                    <td className="truncate-text" title={doc.subject}>
                      {doc.subject || "No subject specified"}
                    </td>
                    <td>
                      <button
                        type="button"
                        className="dept-pill dept-pill-interactive"
                        onClick={() => openDepartment(doc.department)}
                        title={`Click to open ${doc.department} communications`}
                      >
                        {doc.department}
                      </button>
                    </td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-outline btn-xs"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye size={13} />
                        <span>View</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document View / Action Modal */}
      {selectedDoc && (
        <DocumentModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdated={(updated) => {
            setSelectedDoc(updated);
            fetchDashboardData();
          }}
        />
      )}
    </div>
  );
}
