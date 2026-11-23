import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Tag
} from "lucide-react";
import { ALL_SECTIONS } from "../config/departments";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDept, setSearchDept] = useState("");
  const [activeCategory, setActiveCategory] = useState("all"); // 'all' | 'College' | 'Hospital'

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

  // Section lookup map for descriptions and metadata
  const sectionMap = new Map(ALL_SECTIONS.map((s) => [s.name.toLowerCase(), s]));

  const filteredDepts = departments
    .filter((d) => {
      const sec = sectionMap.get(d.department.toLowerCase());
      if (activeCategory !== "all") {
        if (!sec || sec.category !== activeCategory) return false;
      }
      if (!searchDept.trim()) return true;
      const q = searchDept.toLowerCase().trim();
      return (
        d.department.toLowerCase().includes(q) ||
        (sec && sec.description && sec.description.toLowerCase().includes(q)) ||
        (sec && sec.username && sec.username.toLowerCase().includes(q))
      );
    });

  const collegeCount = departments.filter((d) => {
    const sec = sectionMap.get(d.department.toLowerCase());
    return sec && sec.category === "College";
  }).length;

  const hospitalCount = departments.filter((d) => {
    const sec = sectionMap.get(d.department.toLowerCase());
    return sec && sec.category === "Hospital";
  }).length;

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Medical College & Hospital Department Registry</h1>
          <p className="page-subtitle">
            Directory of institutional sections, Google Drive document folders, and active correspondence workloads.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchSummary} title="Refresh records">
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="dept-filter-controls mb-6">
        <div className="category-tabs-wrap">
          <button
            type="button"
            className={`tab-pill ${activeCategory === "all" ? "active" : ""}`}
            onClick={() => setActiveCategory("all")}
          >
            All Sections ({departments.length})
          </button>
          <button
            type="button"
            className={`tab-pill tab-college ${activeCategory === "College" ? "active" : ""}`}
            onClick={() => setActiveCategory("College")}
          >
            College Sections ({collegeCount || 24})
          </button>
          <button
            type="button"
            className={`tab-pill tab-hospital ${activeCategory === "Hospital" ? "active" : ""}`}
            onClick={() => setActiveCategory("Hospital")}
          >
            Hospital Sections ({hospitalCount || 25})
          </button>
        </div>

        <div className="search-input-wrap max-w-md">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="form-input form-input-search"
            placeholder="Search section by name, work, or username..."
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
      </div>

      <div className="dept-cards-grid">
        {loading ? (
          <div className="content-card empty-card-span">
            <RefreshCw size={24} className="animate-spin text-blue mb-2" />
            <p>Loading section workloads from Google Sheets register...</p>
          </div>
        ) : filteredDepts.length === 0 ? (
          <div className="content-card empty-card-span">
            <p className="font-semibold text-muted">No sections match your filter "{searchDept}".</p>
          </div>
        ) : (
          filteredDepts.map((dept) => {
            const sec = sectionMap.get(dept.department.toLowerCase());
            const isCollege = sec?.category === "College";
            return (
              <div key={dept.department} className={`content-card dept-overview-card ${isCollege ? "card-college-border" : "card-hospital-border"}`}>
                <div className="dept-overview-header">
                  <div className={`dept-icon-box ${isCollege ? "bg-blue-subtle" : "bg-emerald-subtle"}`}>
                    <Building2 size={24} className={isCollege ? "text-blue" : "text-emerald"} />
                  </div>
                  <div className="dept-title-container">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`badge-pill text-xs ${isCollege ? "badge-college" : "badge-hospital"}`}>
                        {sec?.category || (dept.department.startsWith("College") ? "College" : "Hospital")}
                      </span>
                      {sec?.username && (
                        <span className="text-xs font-mono text-muted flex items-center gap-1">
                          <Tag size={11} /> {sec.username}
                        </span>
                      )}
                    </div>
                    <Link
                      to={`/admin/communications?department=${encodeURIComponent(dept.department)}`}
                      className="dept-title-link"
                      title={`Click to open ${dept.department} communications`}
                    >
                      <h3 className="dept-title">{dept.department}</h3>
                      <ExternalLink size={14} className="dept-title-icon" />
                    </Link>
                    {sec?.description && (
                      <p className="text-xs text-muted mt-1 leading-snug line-clamp-2" title={sec.description}>
                        {sec.description}
                      </p>
                    )}
                    <span className="drive-folder-tag mt-2">
                      <Folder size={12} /> Drive: MedDean_Documents/{dept.department}
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

                {/* Action Buttons */}
                <div className="dept-card-actions">
                  <Link
                    to={`/admin/communications?department=${encodeURIComponent(dept.department)}`}
                    className="btn btn-primary btn-sm btn-open-dept"
                  >
                    <FileText size={14} />
                    <span>Open Letters</span>
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
            );
          })
        )}
      </div>
    </div>
  );
}
