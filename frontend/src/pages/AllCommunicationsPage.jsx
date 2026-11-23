import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api";
import StatusBadge from "../components/StatusBadge";
import DeadlineBadge from "../components/DeadlineBadge";
import DocumentModal from "../components/DocumentModal";
import {
  FileSpreadsheet,
  Search,
  Filter,
  Eye,
  Calendar,
  Building,
  RefreshCw,
  ExternalLink,
  X,
  CheckCircle2,
  Clock,
  TrendingUp,
  RotateCcw,
  Zap,
  Send
} from "lucide-react";

export default function AllCommunicationsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialDept = searchParams.get("department") || "all";
  const initialStatus = searchParams.get("status") || "all";
  const initialSearch = searchParams.get("search") || "";

  const [documents, setDocuments] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [urgentFilter, setUrgentFilter] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [deptFilter, setDeptFilter] = useState(initialDept);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateFilter, setDateFilter] = useState("");
  const [selectedDoc, setSelectedDoc] = useState(null);

  // Sync state if URL query params change (e.g. user navigated from Dashboard or Departments card)
  useEffect(() => {
    const urlDept = searchParams.get("department");
    const urlStatus = searchParams.get("status");
    const urlSearch = searchParams.get("search");

    if (urlDept && urlDept !== deptFilter) {
      setDeptFilter(urlDept);
    }
    if (urlStatus && urlStatus !== statusFilter) {
      setStatusFilter(urlStatus);
    }
    if (urlSearch && urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchQuery.trim()) params.search = searchQuery.trim();
      if (deptFilter !== "all") params.department = deptFilter;
      if (statusFilter !== "all") params.status = statusFilter;
      if (dateFilter.trim()) params.date = dateFilter.trim();
      if (urgentFilter) params.urgent = "true";

      const res = await api.get("/documents", { params });
      if (res.data.success) {
        setDocuments(res.data.documents || []);
      }
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch departments
    api.get("/departments")
      .then((res) => {
        if (res.data?.departments) setDepartments(res.data.departments);
      })
      .catch((e) => console.error(e));
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [deptFilter, statusFilter, dateFilter, urgentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDocuments();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setDeptFilter("all");
    setStatusFilter("all");
    setDateFilter("");
    setUrgentFilter(false);
    setSearchParams({});
  };

  const handleDepartmentClick = (dept) => {
    setDeptFilter(dept);
    setSearchParams({ department: dept });
  };

  const handleDateChange = (val) => {
    if (!val) {
      setDateFilter("");
      return;
    }
    // val is in YYYY-MM-DD format from <input type="date" />
    const parts = val.split("-");
    if (parts.length === 3) {
      const formatted = `${parts[2]}-${parts[1]}-${parts[0]}`;
      setDateFilter(formatted);
    } else {
      setDateFilter(val);
    }
  };

  // Convert dateFilter (DD-MM-YYYY) back to YYYY-MM-DD for native date picker
  const toNativeDate = (d) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length === 3 && parts[0].length === 2 && parts[2].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return "";
  };

  const collegeDepts = departments.filter((d) => d.toLowerCase().startsWith("college"));
  const hospitalDepts = departments.filter((d) => d.toLowerCase().startsWith("hospital"));
  const otherDepts = departments.filter((d) => !d.toLowerCase().startsWith("college") && !d.toLowerCase().startsWith("hospital"));

  const hasActiveFilters =
    deptFilter !== "all" ||
    statusFilter !== "all" ||
    searchQuery.trim() !== "" ||
    dateFilter.trim() !== "" ||
    urgentFilter;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">All Institutional Communications</h1>
          <p className="page-subtitle">
            Central live register of official incoming letters & departmental actions synced to Google Sheets.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchDocuments}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Quick Status Filter Pills */}
      <div className="status-pills-bar mb-4">
        <span className="filter-pill-label">Quick Filters:</span>
        <button
          type="button"
          className={`status-pill-btn ${statusFilter === "all" && !urgentFilter ? "active" : ""}`}
          onClick={() => {
            setStatusFilter("all");
            setUrgentFilter(false);
          }}
        >
          All Communications
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
          className={`status-pill-btn status-pill-closed ${statusFilter === "Closed" ? "active" : ""}`}
          onClick={() => setStatusFilter("Closed")}
        >
          <CheckCircle2 size={13} />
          Closed
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

      {/* Comprehensive Filter and Search Bar */}
      <div className="content-card mb-6 filter-card">
        <form onSubmit={handleSearchSubmit} className="filters-grid-enhanced">
          {/* Search Box */}
          <div className="filter-item search-filter">
            <label className="filter-label">Search Query</label>
            <div className="search-input-wrap">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="form-input form-input-search"
                placeholder="Search Ref No, Sender, Subject, Doc ID..."
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

          {/* Department Filter */}
          <div className="filter-item">
            <label className="filter-label">Department</label>
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

          {/* Status Filter */}
          <div className="filter-item">
            <label className="filter-label">Status</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Submitted for Closure">Submitted for Closure</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          {/* Calendar Date Picker Filter */}
          <div className="filter-item">
            <label className="filter-label">Filter by Calendar Date</label>
            <div className="date-filter-wrap">
              <input
                type="date"
                className="form-input form-input-calendar-filter"
                value={toNativeDate(dateFilter)}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              {dateFilter && (
                <button
                  type="button"
                  className="date-clear-btn"
                  onClick={() => setDateFilter("")}
                  title="Clear Date"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {dateFilter && (
              <span className="filter-date-tag">Selected: {dateFilter}</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="filter-actions-item">
            <button type="submit" className="btn btn-primary btn-sm">
              <Search size={15} />
              <span>Filter</span>
            </button>
            {hasActiveFilters && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={handleClearFilters}
                title="Reset all filters"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>

        {/* Active Filter Indicators */}
        {hasActiveFilters && (
          <div className="active-filters-chips-bar">
            <span className="active-filter-title">Active Filters:</span>
            {deptFilter !== "all" && (
              <span className="filter-chip">
                <span>Dept: <strong>{deptFilter}</strong></span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => {
                    setDeptFilter("all");
                    setSearchParams({});
                  }}
                >
                  &times;
                </button>
              </span>
            )}
            {statusFilter !== "all" && (
              <span className="filter-chip">
                <span>Status: <strong>{statusFilter}</strong></span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => setStatusFilter("all")}
                >
                  &times;
                </button>
              </span>
            )}
            {urgentFilter && (
              <span className="filter-chip filter-chip-urgent">
                <span>Priority: <strong>⚡ Urgent Only</strong></span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => setUrgentFilter(false)}
                >
                  &times;
                </button>
              </span>
            )}
            {dateFilter && (
              <span className="filter-chip">
                <span>Date: <strong>{dateFilter}</strong></span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => setDateFilter("")}
                >
                  &times;
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="filter-chip">
                <span>Keyword: "<strong>{searchQuery}</strong>"</span>
                <button
                  type="button"
                  className="chip-remove"
                  onClick={() => setSearchQuery("")}
                >
                  &times;
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Communications Table */}
      <div className="content-card">
        <div className="card-header">
          <div className="card-title-group">
            <FileSpreadsheet size={18} className="text-blue" />
            <h2 className="card-title">
              Communications Register ({documents.length} Records)
            </h2>
          </div>

          {deptFilter !== "all" && (
            <span className="active-dept-header-badge">
              Viewing Department: <strong>{deptFilter}</strong>
            </span>
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
                <th style={{ minWidth: "150px" }}>From / Sender</th>
                <th style={{ minWidth: "210px" }}>Subject</th>
                <th style={{ width: "150px" }}>Department</th>
                <th style={{ width: "135px" }}>Status</th>
                <th style={{ width: "120px" }}>Last Updated</th>
                <th style={{ width: "80px", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="empty-table-cell">
                    <RefreshCw size={20} className="animate-spin mb-2" />
                    <div>Loading records from Google Sheets register...</div>
                  </td>
                </tr>
              ) : documents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="empty-table-cell">
                    <p className="font-semibold text-muted">No communications found matching the current criteria.</p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        className="btn btn-outline btn-xs mt-2"
                        onClick={handleClearFilters}
                      >
                        Reset Filters
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                documents.map((doc) => (
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
                    <td>
                      <button
                        type="button"
                        className="dept-pill dept-pill-interactive"
                        onClick={() => handleDepartmentClick(doc.department)}
                        title={`Click to filter solely by ${doc.department}`}
                      >
                        {doc.department}
                      </button>
                    </td>
                    <td>
                      <StatusBadge status={doc.status} />
                    </td>
                    <td className="text-muted text-xs">{doc.lastUpdated}</td>
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

      {/* Modal */}
      {selectedDoc && (
        <DocumentModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdated={(updated) => {
            setSelectedDoc(updated);
            fetchDocuments();
          }}
        />
      )}
    </div>
  );
}
