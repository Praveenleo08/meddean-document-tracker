import React, { useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import DeadlineBadge from "../components/DeadlineBadge";
import DocumentModal from "../components/DocumentModal";
import {
  Building2,
  Clock,
  TrendingUp,
  CheckCircle2,
  FileText,
  Eye,
  RefreshCw,
  FolderOpen,
  Send,
  Zap
} from "lucide-react";

export default function DepartmentDashboardPage() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    submittedForClosure: 0,
    closed: 0,
    urgent: 0
  });
  const [pendingDocs, setPendingDocs] = useState([]);
  const [allMyDocs, setAllMyDocs] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // 'pending' | 'all'
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  const fetchDepartmentData = async () => {
    setLoading(true);
    try {
      const summaryRes = await api.get("/dashboard/summary");
      if (summaryRes.data?.success) {
        setMetrics(summaryRes.data.metrics || {});
      }

      // Fetch pending documents (strictly server-enforced)
      const pendingRes = await api.get("/documents/pending");
      if (pendingRes.data?.success) {
        setPendingDocs(pendingRes.data.documents || []);
      }

      // Fetch all communications for this department
      const allRes = await api.get("/documents");
      if (allRes.data?.success) {
        setAllMyDocs(allRes.data.documents || []);
      }
    } catch (err) {
      console.error("Error loading department dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentData();
  }, [user]);

  const displayedDocs = activeTab === "pending" ? pendingDocs : allMyDocs;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="dept-badge-header">
            <Building2 size={16} />
            <span>{user?.department} Department</span>
          </div>
          <h1 className="page-title">{user?.department} Operational Portal</h1>
          <p className="page-subtitle">
            Official communications assigned by Dean's Office requiring departmental action and compliance.
          </p>
        </div>

        <div className="page-actions">
          <button className="btn btn-secondary btn-sm" onClick={fetchDepartmentData}>
            <RefreshCw size={15} />
            <span>Refresh Works</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Pending Works</span>
            <div className="kpi-icon-wrap icon-amber">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value text-amber">{metrics.pending}</div>
          <div className="kpi-footer">Requires Prompt Action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">In Progress</span>
            <div className="kpi-icon-wrap icon-indigo">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value text-indigo">{metrics.inProgress}</div>
          <div className="kpi-footer">Currently Being Processed</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Submitted for Closure</span>
            <div className="kpi-icon-wrap icon-purple">
              <Send size={20} />
            </div>
          </div>
          <div className="kpi-value text-purple">{metrics.submittedForClosure || 0}</div>
          <div className="kpi-footer">Awaiting Dean Approval</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Urgent Actions</span>
            <div className="kpi-icon-wrap icon-neon-red">
              <Zap size={20} />
            </div>
          </div>
          <div className="kpi-value text-neon-red">{metrics.urgent || 0}</div>
          <div className="kpi-footer">High-Priority Direct Action</div>
        </div>

        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-title">Closed Works</span>
            <div className="kpi-icon-wrap icon-emerald">
              <CheckCircle2 size={20} />
            </div>
          </div>
          <div className="kpi-value text-emerald">{metrics.closed}</div>
          <div className="kpi-footer">Dean Approved & Sealed</div>
        </div>
      </div>

      {/* Main Table Section */}
      <div className="content-card">
        <div className="card-header">
          <div className="tab-buttons-group">
            <button
              className={`tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <Clock size={16} />
              <span>Pending & Active Works ({pendingDocs.length})</span>
            </button>
            <button
              className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              <FolderOpen size={16} />
              <span>All My Department Communications ({allMyDocs.length})</span>
            </button>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "120px" }}>Doc ID</th>
                <th style={{ width: "150px" }}>Reference No</th>
                <th style={{ width: "100px" }}>Date</th>
                <th style={{ width: "140px" }}>Deadline</th>
                <th style={{ minWidth: "150px" }}>From</th>
                <th style={{ minWidth: "180px" }}>Subject</th>
                <th style={{ width: "135px" }}>Status</th>
                <th style={{ width: "110px", textAlign: "center" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    Loading department communications...
                  </td>
                </tr>
              ) : displayedDocs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="empty-table-cell">
                    {activeTab === "pending"
                      ? "Zero pending works for your department. Excellent work!"
                      : "No records found for your department."}
                  </td>
                </tr>
              ) : (
                displayedDocs.map((doc) => (
                  <tr
                    key={doc.documentId}
                    className={doc.isUrgent ? "row-urgent-neon" : ""}
                  >
                    <td className="font-mono text-muted">{doc.documentId}</td>
                    <td className="font-semibold">
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
                      <StatusBadge status={doc.status} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        className="btn btn-primary btn-xs"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <Eye size={13} />
                        <span>View / Action</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Status Update Modal */}
      {selectedDoc && (
        <DocumentModal
          document={selectedDoc}
          onClose={() => setSelectedDoc(null)}
          onUpdated={(updated) => {
            setSelectedDoc(updated);
            fetchDepartmentData();
          }}
        />
      )}
    </div>
  );
}
