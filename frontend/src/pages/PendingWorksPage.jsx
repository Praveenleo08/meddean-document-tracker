import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import DeadlineBadge from "../components/DeadlineBadge";
import DocumentModal from "../components/DocumentModal";
import { useAuth } from "../context/AuthContext";
import {
  Clock,
  Eye,
  AlertCircle,
  RefreshCw,
  Building,
  Search,
  Filter,
  RotateCcw,
  TrendingUp,
  Send,
  Zap
} from "lucide-react";

export default function PendingWorksPage() {
  const { user, isAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get("department") || "all";

  const [pendingDocs, setPendingDocs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deptFilter, setDeptFilter] = useState(initialDept);
  const [statusFilter, setStatusFilter] = useState("all");
  const [urgentFilter, setUrgentFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchPendingDocs = async () => {
    setLoading(true);
    try {
      const params = {};
      if (isAdmin && deptFilter !== "all") {
        params.department = deptFilter;
      }
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      if (urgentFilter) {
        params.urgent = "true";
      }
      const res = await api.get("/documents/pending", { params });
      if (res.data.success) {
        setPendingDocs(res.data.documents || []);
      }
    } catch (err) {
      console.error("Error fetching pending documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      api.get("/departments")
        .then((res) => {
          if (res.data?.departments) setDepartments(res.data.departments);
        })
        .catch((e) => console.error(e));
    }
  }, [isAdmin]);

  useEffect(() => {
    const urlDept = searchParams.get("department");
    if (urlDept && urlDept !== deptFilter) {
      setDeptFilter(urlDept);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchPendingDocs();
  }, [deptFilter, statusFilter, urgentFilter]);

  const collegeDepts = departments.filter((d) => d.toLowerCase().startsWith("college"));
  const hospitalDepts = departments.filter((d) => d.toLowerCase().startsWith("hospital"));
  const otherDepts = departments.filter((d) => !d.toLowerCase().startsWith("college") && !d.toLowerCase().startsWith("hospital"));

  const filteredDocs = pendingDocs.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (doc.referenceNo && doc.referenceNo.toLowerCase().includes(q)) ||
      (doc.from && doc.from.toLowerCase().includes(q)) ||
      (doc.subject && doc.subject.toLowerCase().includes(q)) ||
      (doc.documentId && doc.documentId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isAdmin ? "Institutional Pending Work Register" : `${user?.department} Pending Work`}
          </h1>
          <p className="page-subtitle">
            Communications requiring immediate review, processing, and response.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchPendingDocs} title="Refresh pending records">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Status Filter Pills */}
      <div className="status-pills-bar mb-4">
        <span className="filter-pill-label">Filter Action:</span>
        <button
          type="button"
          className={`status-pill-btn ${statusFilter === "all" && !urgentFilter ? "active" : ""}`}
          onClick={() => {
            setStatusFilter("all");
            setUrgentFilter(false);
          }}
        >
          All Unclosed
        </button>
        <button
          type="button"
          className={`status-pill-btn status-pill-pending ${statusFilter === "Pending" ? "active" : ""}`}
          onClick={() => setStatusFilter("Pending")}
        >
          <Clock size={13} />
          Pending
        </button>
        <button
          type="button"
          className={`status-pill-btn status-pill-progress ${statusFilter === "In Progress" ? "active" : ""}`}
          onClick={() => setStatusFilter("In Progress")}
        >
          <TrendingUp size={13} />
          In Progress
        </button>
        <button
          type="button"
          className={`status-pill-btn status-pill-submitted ${statusFilter === "Submitted for Closure" ? "active" : ""}`}
          onClick={() => setStatusFilter("Submitted for Closure")}
        >
          <Send size={13} />
          Submitted for Closure
        </button>
        <button
          type="button"
          className={`status-pill-btn status-pill-urgent ${urgentFilter ? "active active-urgent-glow" : ""}`}
          onClick={() => setUrgentFilter(!urgentFilter)}
          title="Filter only high-priority urgent communications"
        >
          <Zap size={13} />
          ⚡ Urgent Only
        </button>
      </div>

      {/* Filter Bar for Pending Works */}
      {isAdmin && (
        <div className="content-card mb-6 p-4">
          <div className="filters-grid-compact">
            <div className="filter-item">
              <label className="filter-label">Filter Department</label>
              <select
                className="form-select"
                value={deptFilter}
                onChange={(e) => {
                  setDeptFilter(e.target.value);
                  setSearchParams(
                    e.target.value === "all"
                      ? {}
                      : { department: e.target.value }
                  );
                }}
              >
                <option value="all">All Sections ({departments.length})</option>
                {collegeDepts.length > 0 && (
                  <optgroup label="COLLEGE" className="optgroup-header optgroup-college">
                    {collegeDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                )}
                {hospitalDepts.length > 0 && (
                  <optgroup label="HOSPITAL" className="optgroup-header optgroup-hospital">
                    {hospitalDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                )}
                {otherDepts.length > 0 && (
                  <optgroup label="OTHER SECTIONS">
                    {otherDepts.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>

            <div className="filter-item search-filter">
              <label className="filter-label">Search Pending Letters</label>
              <div className="search-input-wrap">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="form-input form-input-search"
                  placeholder="Search ref no, sender, subject..."
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

            {(deptFilter !== "all" || searchQuery || statusFilter !== "all" || urgentFilter) && (
              <div className="filter-actions-item">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setDeptFilter("all");
                    setStatusFilter("all");
                    setUrgentFilter(false);
                    setSearchQuery("");
                    setSearchParams({});
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="content-card">
        <div className="card-header">
          <div className="card-title-group">
            <Clock size={18} className="text-amber" />
            <h2 className="card-title">Pending Communications ({filteredDocs.length})</h2>
          </div>
          {deptFilter !== "all" && (
            <span className="active-dept-header-badge">
              Department: <strong>{deptFilter}</strong>
            </span>
          )}
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Doc ID</th>
                <th style={{ width: "150px" }}>Ref No</th>
                <th style={{ width: "100px" }}>Date</th>
                <th style={{ width: "140px" }}>Deadline</th>
                <th style={{ minWidth: "150px" }}>From / Sender</th>
                <th style={{ minWidth: "200px" }}>Subject</th>
                {isAdmin && <th style={{ width: "150px" }}>Department</th>}
                <th style={{ width: "130px" }}>Status</th>
                <th style={{ width: "120px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="empty-table-cell">
                    <RefreshCw size={20} className="animate-spin mb-2" />
                    <div>Loading pending communications...</div>
                  </td>
                </tr>
              ) : filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 9 : 8} className="empty-table-cell text-emerald">
                    Zero pending communications. All work is up to date!
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc) => (
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
                    <td className="truncate-text" title={doc.from}>
                      <strong>{doc.from}</strong>
                    </td>
                    <td className="truncate-text" title={doc.subject}>
                      {doc.subject || "No subject specified"}
                    </td>
                    {isAdmin && (
                      <td>
                        <Link
                          to={`/admin/communications?department=${encodeURIComponent(doc.department)}`}
                          className="dept-pill dept-pill-interactive"
                          title={`Open ${doc.department} communications`}
                        >
                          {doc.department}
                        </Link>
                      </td>
                    )}
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye size={13} />
                        <span>Action / Review</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedDoc && (
        <DocumentModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdated={(updated) => {
            setSelectedDoc(updated);
            fetchPendingDocs();
          }}
        />
      )}
    </div>
  );
}
