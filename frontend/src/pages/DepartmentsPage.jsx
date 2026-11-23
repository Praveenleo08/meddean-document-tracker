import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import {
  Building2,
  Folder,
  RefreshCw,
  ArrowRight,
  ExternalLink,
  Clock,
  FileText,
  Search,
  CheckCircle2,
  TrendingUp
} from "lucide-react";

export default function DepartmentsPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDept, setSearchDept] = useState("");

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/summary");
      if (res.data?.departmentSummary) {
        setDepartments(res.data.departmentSummary);
      }
    } catch (err) {
      console.error("Error fetching department summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const filteredDepts = departments.filter((d) =>
    d.department.toLowerCase().includes(searchDept.toLowerCase().trim())
  );

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical College Department Registry</h1>
          <p className="page-subtitle">
            Directory of institutional departments, Google Drive document folders, and active letter workloads.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchSummary} title="Refresh records">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search Bar for Departments */}
      <div className="dept-search-bar mb-6">
        <div className="search-input-wrap max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input form-input-search"
            placeholder="Search department (e.g. Pharmacy, Administration, Finance...)"
            value={searchDept}
            onChange={(e) => setSearchDept(e.target.value)}
          />
          {searchDept && (
            <button
              type="button"
              className="search-clear-btn"
              onClick={() => setSearchDept("")}
            >
              &times;
            </button>
          )}
        </div>
        <span className="text-xs text-muted">
          Showing {filteredDepts.length} of {departments.length} departments
        </span>
      </div>

      <div className="dept-cards-grid">
        {loading ? (
          <div className="content-card empty-card-span">
            <RefreshCw size={24} className="animate-spin text-blue mb-2" />
            <p>Loading department workloads from Google Sheets register...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="content-card empty-card-span">
            <p className="font-semibold text-muted">No department matches "{searchDept}".</p>
          </div>
        ) : (
          filteredDepts.map((dept) => (
            <div key={dept.department} className="content-card dept-overview-card">
              <div className="dept-overview-header">
                <div className="dept-icon-box">
                  <Building2 size={24} className="text-blue" />
                </div>
                <div className="dept-title-container">
                  <Link
                    to={`/admin/communications?department=${encodeURIComponent(dept.department)}`}
                    className="dept-title-link"
                    title={`Click to open ${dept.department} communications`}
                  >
                    <h3 className="dept-title">{dept.department}</h3>
                    <ExternalLink size={14} className="dept-title-icon" />
                  </Link>
                  <span className="drive-folder-tag">
                    <Folder size={12} /> Drive Folder: MedDean_Documents/{dept.department}
                  </span>
                </div>
              </div>

              {/* Department Statistics */}
              <div className="dept-overview-kpis">
                <Link
                  to={`/admin/communications?department=${encodeURIComponent(dept.department)}`}
                  className="dept-kpi-box dept-kpi-interactive"
                  title="View all letters for this department"
                >
                  <span className="kpi-num text-blue">{dept.total}</span>
                  <span className="kpi-lbl">Total Letters</span>
                </Link>

                <Link
                  to={`/admin/communications?department=${encodeURIComponent(dept.department)}&status=Pending`}
                  className={`dept-kpi-box dept-kpi-interactive ${dept.pending > 0 ? "kpi-box-urgent" : ""}`}
                  title="View pending letters"
                >
                  <span className={`kpi-num ${dept.pending > 0 ? "text-amber font-bold" : ""}`}>
                    {dept.pending}
                  </span>
                  <span className="kpi-lbl">Pending</span>
                </Link>

                <Link
                  to={`/admin/communications?department=${encodeURIComponent(dept.department)}&status=In%20Progress`}
                  className="dept-kpi-box dept-kpi-interactive"
                  title="View in-progress letters"
                >
                  <span className="kpi-num text-indigo">{dept.inProgress}</span>
                  <span className="kpi-lbl">In Progress</span>
                </Link>

                <Link
                  to={`/admin/communications?department=${encodeURIComponent(dept.department)}&status=Closed`}
                  className="dept-kpi-box dept-kpi-interactive"
                  title="View closed letters"
                >
                  <span className="kpi-num text-emerald">{dept.closed}</span>
                  <span className="kpi-lbl">Closed</span>
                </Link>
              </div>

              {/* Action Buttons to Open Department */}
              <div className="dept-card-actions">
                <Link
                  to={`/admin/communications?department=${encodeURIComponent(dept.department)}`}
                  className="btn btn-primary btn-sm btn-open-dept"
                >
                  <FileText size={14} />
                  <span>Open {dept.department} Letters</span>
                  <ArrowRight size={14} />
                </Link>

                {dept.pending > 0 && (
                  <Link
                    to={`/admin/communications?department=${encodeURIComponent(dept.department)}&status=Pending`}
                    className="btn btn-outline btn-sm btn-pending-dept"
                    title={`View ${dept.pending} Pending Letter(s)`}
                  >
                    <Clock size={13} className="text-amber" />
                    <span>{dept.pending} Pending</span>
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
