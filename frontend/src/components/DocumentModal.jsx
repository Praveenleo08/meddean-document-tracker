import React, { useState } from "react";
import api from "../services/api";
import StatusBadge from "./StatusBadge";
import DeadlineBadge from "./DeadlineBadge";
import { useAuth } from "../context/AuthContext";
import {
  X,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Building,
  Calendar,
  User,
  Hash,
  Zap,
  RotateCcw,
  ShieldCheck
} from "lucide-react";

export default function DocumentModal({ document, onClose, onUpdated }) {
  if (!document) return null;

  const { user, isAdmin } = useAuth();
  const [status, setStatus] = useState(document.status || "Pending");
  const [remarks, setRemarks] = useState(document.remarks || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleUpdateStatus = async (newStatus) => {
    if ((newStatus === "Closed" || newStatus === "Submitted for Closure") && !remarks.trim() && !document.remarks) {
      setError("Please provide 'Action Taken / Remarks' before submitting or closing this communication.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await api.put(`/documents/${document.documentId}/status`, {
        status: newStatus,
        remarks: remarks.trim()
      });

      if (res.data.success) {
        setStatus(newStatus);
        setSuccessMsg(
          newStatus === "Submitted for Closure"
            ? "Action report submitted to the Dean's Office for final verification & closure."
            : newStatus === "Closed"
            ? "Communication officially approved and closed by the Dean."
            : `Status successfully updated to ${newStatus}`
        );
        if (onUpdated) {
          onUpdated(res.data.document);
        }
      } else {
        setError(res.data.error || "Failed to update document status.");
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Failed to update document status.");
    } finally {
      setLoading(false);
    }
  };

  const [isImage, setIsImage] = useState(false);

  // Authenticated server stream URL (resolves both local storage and Google Drive OAuth API stream)
  const streamPreviewUrl = document.driveFileId
    ? `/api/documents/preview/${document.driveFileId}`
    : document.driveFileLink?.startsWith("/")
    ? document.driveFileLink
    : null;

  // External full view URL (for Open in New Window button)
  const fullViewUrl =
    document.driveFileLink && document.driveFileLink !== "#"
      ? document.driveFileLink
      : streamPreviewUrl || "#";

  React.useEffect(() => {
    if (streamPreviewUrl) {
      const img = new Image();
      img.onload = () => setIsImage(true);
      img.onerror = () => setIsImage(false);
      img.src = streamPreviewUrl;
    }
  }, [streamPreviewUrl]);

  const isUrgent = document.isUrgent === true || document.isUrgent === "YES";
  const isSubmittedForClosure =
    status === "Submitted for Closure" ||
    status === "Submitted for Review" ||
    status?.toLowerCase() === "submitted for closure";

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-container ${isUrgent ? "modal-urgent-neon" : ""}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Neon Red Banner for Urgent Communications */}
        {isUrgent && (
          <div className="modal-urgent-banner">
            <span className="modal-urgent-banner-text">
              <Zap size={16} /> Urgent Institutional Priority — Immediate Dean Review Required
            </span>
            <span className="urgent-badge-neon">⚡ URGENT</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <span className="modal-doc-id">{document.documentId}</span>
            <h2 className="modal-title">
              {document.referenceNo || "Official Communication"}
            </h2>
            {isUrgent && <span className="urgent-badge-neon ml-2">⚡ URGENT</span>}
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body-grid">
          {/* Left Column: Metadata & Workflow Actions */}
          <div className="modal-left-col">
            <div className="details-card">
              <h3 className="section-heading">Communication Details</h3>

              <div className="detail-row">
                <span className="detail-label">
                  <Hash size={14} /> Document ID:
                </span>
                <span className="detail-value font-mono">{document.documentId}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <FileText size={14} /> Ref Number:
                </span>
                <span className="detail-value font-semibold">
                  {document.referenceNo || "N/A"}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <Building size={14} /> Department:
                </span>
                <span className="detail-value dept-pill">{document.department}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <User size={14} /> From / Sender:
                </span>
                <span className="detail-value">{document.from || "Not specified"}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <Calendar size={14} /> Communication Date:
                </span>
                <span className="detail-value">{document.communicationDate}</span>
              </div>

              {/* Deadline Date */}
              {document.deadlineDate && (
                <div className="detail-row">
                  <span className="detail-label">
                    <Clock size={14} /> Deadline / Due Date:
                  </span>
                  <span className="detail-value">
                    <DeadlineBadge deadlineDate={document.deadlineDate} status={status} />
                  </span>
                </div>
              )}

              {/* Priority */}
              <div className="detail-row">
                <span className="detail-label">
                  <Zap size={14} /> Priority Level:
                </span>
                <span className="detail-value">
                  {isUrgent ? (
                    <span className="urgent-badge-neon">⚡ URGENT ACTION</span>
                  ) : (
                    <span className="text-muted font-semibold">Standard Priority</span>
                  )}
                </span>
              </div>

              <div className="detail-row">
                <span className="detail-label">
                  <Calendar size={14} /> Received in Dean Office:
                </span>
                <span className="detail-value">{document.receivedDate}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Current Status:</span>
                <StatusBadge status={status} />
              </div>

              {document.closedDate && (
                <div className="detail-row">
                  <span className="detail-label">Closed Date:</span>
                  <span className="detail-value text-emerald font-semibold">{document.closedDate}</span>
                </div>
              )}

              <div className="subject-box">
                <span className="detail-label">Subject:</span>
                <p className="subject-text">{document.subject || "No subject specified."}</p>
              </div>
            </div>

            {/* Workflow Action Panel */}
            <div className="workflow-card">
              <div className="d-flex justify-between items-center mb-2">
                <h3 className="section-heading mb-0">Workflow Action & Remarks</h3>
                {isAdmin ? (
                  <span className="text-xs font-semibold text-blue flex items-center gap-1">
                    <ShieldCheck size={14} /> Dean Authorization Active
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-muted">
                    {user?.department} Department Officer
                  </span>
                )}
              </div>

              {/* Information Notice for Department Users */}
              {!isAdmin && status !== "Closed" && (
                <div className="text-xs text-muted mb-3 p-2 bg-slate-50 border rounded">
                  ℹ️ <strong>Institutional Rule:</strong> Department users can process and{" "}
                  <strong>Submit for Closure</strong>. Final closure is authorized solely by the Dean.
                </div>
              )}

              {isSubmittedForClosure && (
                <div className="alert alert-info mb-3">
                  <Clock size={16} />
                  <span>
                    <strong>Submitted for Closure:</strong> Action report forwarded to the Dean's
                    Office. Awaiting Dean verification.
                  </span>
                </div>
              )}

              {error && (
                <div className="alert alert-error mb-3">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success mb-3">
                  <CheckCircle size={16} />
                  <span>{successMsg}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">
                  Action Taken / Resolution Remarks:
                  {status !== "Closed" && (
                    <span className="text-muted"> (Required to Submit or Close)</span>
                  )}
                </label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter detailed action taken, resolution report, committee decisions, or closing notes..."
                />
              </div>

              <div className="action-buttons-group">
                {/* 1. DEPARTMENT USER ACTIONS (Cannot close directly) */}
                {!isAdmin && (
                  <>
                    {status === "Pending" && (
                      <button
                        className="btn btn-warning"
                        disabled={loading}
                        onClick={() => handleUpdateStatus("In Progress")}
                      >
                        <Clock size={16} />
                        <span>Mark In Progress</span>
                      </button>
                    )}

                    {status === "In Progress" && (
                      <button
                        className="btn btn-primary"
                        disabled={loading}
                        onClick={() => handleUpdateStatus("Submitted for Closure")}
                        title="Forward resolution to Dean for final approval and closure"
                      >
                        <Send size={16} />
                        <span>Submit for Closure</span>
                      </button>
                    )}

                    {isSubmittedForClosure && (
                      <button
                        className="btn btn-outline"
                        disabled={loading}
                        onClick={() => handleUpdateStatus("In Progress")}
                      >
                        <RotateCcw size={15} />
                        <span>Revert to In Progress</span>
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      disabled={loading}
                      onClick={() => handleUpdateStatus(status)}
                    >
                      <FileText size={16} />
                      <span>Save Remarks Only</span>
                    </button>
                  </>
                )}

                {/* 2. DEAN / ADMIN ACTIONS (Sole authority to close) */}
                {isAdmin && (
                  <>
                    {/* Dean Close Button for Submitted for Closure */}
                    {isSubmittedForClosure && (
                      <>
                        <button
                          className="btn btn-success"
                          disabled={loading}
                          onClick={() => handleUpdateStatus("Closed")}
                        >
                          <CheckCircle size={16} />
                          <span>Approve & Close Work</span>
                        </button>
                        <button
                          className="btn btn-outline"
                          disabled={loading}
                          onClick={() => handleUpdateStatus("In Progress")}
                        >
                          <RotateCcw size={15} />
                          <span>Return to Department</span>
                        </button>
                      </>
                    )}

                    {/* Dean actions for Pending */}
                    {status === "Pending" && (
                      <>
                        <button
                          className="btn btn-warning"
                          disabled={loading}
                          onClick={() => handleUpdateStatus("In Progress")}
                        >
                          <Clock size={16} />
                          <span>Mark In Progress</span>
                        </button>
                        <button
                          className="btn btn-success"
                          disabled={loading}
                          onClick={() => handleUpdateStatus("Closed")}
                        >
                          <CheckCircle size={16} />
                          <span>Close Work Directly</span>
                        </button>
                      </>
                    )}

                    {/* Dean actions for In Progress */}
                    {status === "In Progress" && (
                      <button
                        className="btn btn-success"
                        disabled={loading}
                        onClick={() => handleUpdateStatus("Closed")}
                      >
                        <CheckCircle size={16} />
                        <span>Close Work</span>
                      </button>
                    )}

                    {/* Dean action to reopen if closed */}
                    {status === "Closed" && (
                      <button
                        className="btn btn-outline"
                        disabled={loading}
                        onClick={() => handleUpdateStatus("In Progress")}
                      >
                        <RotateCcw size={15} />
                        <span>Re-open Communication</span>
                      </button>
                    )}

                    <button
                      className="btn btn-secondary"
                      disabled={loading}
                      onClick={() => handleUpdateStatus(status)}
                    >
                      <FileText size={16} />
                      <span>Save Remarks Only</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Original Document Viewer */}
          <div className="modal-right-col">
            <div className="doc-preview-header">
              <span className="preview-title">Original Scanned Document</span>
              {fullViewUrl && fullViewUrl !== "#" && (
                <a
                  href={fullViewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-xs flex items-center gap-1"
                  title="Open full document in new window"
                >
                  <ExternalLink size={14} />
                  <span>Open Full View</span>
                </a>
              )}
            </div>

            <div className="doc-preview-frame-container">
              {streamPreviewUrl ? (
                isImage ? (
                  <div className="doc-preview-image-wrapper">
                    <img
                      src={streamPreviewUrl}
                      alt="Original Scanned Document"
                      className="doc-preview-image"
                    />
                  </div>
                ) : (
                  <iframe
                    src={streamPreviewUrl}
                    title="Document Preview"
                    className="doc-preview-iframe"
                  />
                )
              ) : (
                <div className="preview-placeholder">
                  <FileText size={48} className="placeholder-icon" />
                  <p>Document archive link: {document.driveFileId}</p>
                  <span className="text-muted">
                    Record synchronized with Google Sheets Register.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="meta-sync-notice">
            <span className="live-dot"></span>
            Syncs to: Google Drive & Google Sheet ("Communication Register")
          </div>
          <button className="btn btn-secondary" onClick={onClose}>
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
