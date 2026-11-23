import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import CameraCapture from "../components/CameraCapture";
import {
  UploadCloud,
  Camera,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Building,
  Calendar,
  User,
  Hash,
  ArrowRight,
  ExternalLink,
  CalendarDays,
  Sparkles,
  Clock,
  Zap,
  X
} from "lucide-react";
import {
  toDateInputValue,
  fromDateInputValue,
  getTodayFormatted,
  addDaysFormatted,
  getDeadlineStatus
} from "../utils/dateUtils";

function renderHighlightedSender(text, query) {
  if (!query || !query.trim()) return <span>{text}</span>;
  const q = query.trim().toLowerCase();
  const idx = text.toLowerCase().indexOf(q);
  if (idx === -1) return <span>{text}</span>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  return (
    <span>
      {before}
      <strong className="matched-text-highlight">{match}</strong>
      {after}
    </span>
  );
}

import {
  INCOMING_SENDERS,
  COLLEGE_SECTIONS,
  HOSPITAL_SECTIONS,
  ALL_SECTIONS,
  DEPARTMENTS
} from "../config/departments";

const DEFAULT_SENDERS = INCOMING_SENDERS;

export default function UploadPage() {
  const [collegeSections, setCollegeSections] = useState(COLLEGE_SECTIONS);
  const [hospitalSections, setHospitalSections] = useState(HOSPITAL_SECTIONS);
  const [departments, setDepartments] = useState(DEPARTMENTS);
  const [selectedDept, setSelectedDept] = useState(COLLEGE_SECTIONS[0].name);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  // Senders list for autocomplete suggestions
  const [knownSenders, setKnownSenders] = useState(DEFAULT_SENDERS);
  const [showSenderSuggestions, setShowSenderSuggestions] = useState(false);

  // Manual Entry Form Fields (kept empty by default for manual entry)
  const [referenceNo, setReferenceNo] = useState("");
  const [communicationDate, setCommunicationDate] = useState("");
  const [deadlineDate, setDeadlineDate] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [fromSender, setFromSender] = useState("");
  const [subject, setSubject] = useState("");
  const [remarks, setRemarks] = useState("");

  // Upload & Save State
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [fileError, setFileError] = useState("");
  const [registeredDoc, setRegisteredDoc] = useState(null);

  const fileInputRef = useRef(null);
  const mobileCameraInputRef = useRef(null);
  const senderContainerRef = useRef(null);

  useEffect(() => {
    // 1. Fetch authorized departments & sections list
    api.get("/departments")
      .then((res) => {
        if (res.data) {
          if (res.data.collegeSections && res.data.collegeSections.length > 0) {
            setCollegeSections(res.data.collegeSections);
          }
          if (res.data.hospitalSections && res.data.hospitalSections.length > 0) {
            setHospitalSections(res.data.hospitalSections);
          }
          if (res.data.departments && res.data.departments.length > 0) {
            setDepartments(res.data.departments);
          }
          if (res.data.incomingSenders && res.data.incomingSenders.length > 0) {
            setKnownSenders(res.data.incomingSenders);
          }
        }
      })
      .catch((err) => console.error("Error loading departments:", err));

    // 2. Fetch known senders for predictive autocomplete
    api.get("/documents/senders")
      .then((res) => {
        if (res.data && res.data.senders && res.data.senders.length > 0) {
          setKnownSenders(res.data.senders);
        }
      })
      .catch((err) => console.warn("Notice: could not load senders list:", err));

    // Close suggestions dropdown on outside click
    const handleClickOutside = (e) => {
      if (senderContainerRef.current && !senderContainerRef.current.contains(e.target)) {
        setShowSenderSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(selectedFile.type)) {
      setFileError("Unsupported format. Please select a PDF or Image (JPG, JPEG, PNG).");
      return;
    }

    setFileError("");
    setSaveError("");
    setFile(selectedFile);
    setRegisteredDoc(null);

    if (selectedFile.type.startsWith("image/")) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
    } else {
      setPreviewUrl("pdf_preview");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSaveAndRegister = async () => {
    if (saveLoading) return;

    if (!file) {
      setSaveError("Please select or capture a document file.");
      return;
    }

    if (!selectedDept) {
      setSaveError("Please select an authorized department.");
      return;
    }

    if (!referenceNo.trim()) {
      setSaveError("Please enter the Reference Number.");
      return;
    }

    setSaveLoading(true);
    setSaveError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("referenceNo", referenceNo.trim());
      formData.append("communicationDate", (communicationDate || getTodayFormatted()).trim());
      formData.append("deadlineDate", (deadlineDate || "").trim());
      formData.append("isUrgent", isUrgent ? "true" : "false");
      formData.append("from", fromSender.trim());
      formData.append("subject", subject.trim());
      formData.append("department", selectedDept);
      formData.append("remarks", remarks.trim());

      const res = await api.post("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setRegisteredDoc(res.data.document);
      } else {
        setSaveError(res.data.error || "Failed to register document.");
      }
    } catch (err) {
      setSaveError(
        err.response?.data?.error || err.message || "Failed to save and register document."
      );
    } finally {
      setSaveLoading(false);
    }
  };

  const resetForm = () => {
    setFile(null);
    setPreviewUrl(null);
    setRegisteredDoc(null);
    setReferenceNo("");
    setCommunicationDate("");
    setDeadlineDate("");
    setIsUrgent(false);
    setFromSender("");
    setSubject("");
    setRemarks("");
    setFileError("");
    setSaveError("");
  };

  // Filtered senders matching input
  const matchingSenders = fromSender.trim()
    ? knownSenders.filter((s) =>
        s.toLowerCase().includes(fromSender.toLowerCase())
      )
    : knownSenders;

  const deadlineInfo = getDeadlineStatus(deadlineDate);

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Upload & Register Document</h1>
          <p className="page-subtitle">
            Upload administrative communications, manually enter registration details, and automatically store to Google Drive & Google Sheets.
          </p>
        </div>
      </div>

      {/* Confirmation Screen */}
      {registeredDoc ? (
        <div className="content-card registration-success-card">
          <div className="success-icon-badge">
            <CheckCircle2 size={48} className="text-emerald" />
          </div>
          <h2 className="success-title">Document Registered Successfully</h2>
          <p className="success-desc">
            The communication has been uploaded to Google Drive and recorded in the central Google Sheet register.
          </p>

          <div className="success-details-box">
            <div className="success-row">
              <span className="success-label">Document ID:</span>
              <span className="success-val font-mono font-bold text-blue">
                {registeredDoc.documentId}
              </span>
            </div>

            <div className="success-row">
              <span className="success-label">Reference No:</span>
              <span className="success-val font-semibold">
                {registeredDoc.referenceNo || "N/A"}
              </span>
            </div>

            <div className="success-row">
              <span className="success-label">Assigned Department:</span>
              <span className="dept-pill">{registeredDoc.department}</span>
            </div>

            <div className="success-row">
              <span className="success-label">Initial Status:</span>
              <span className="status-badge badge-pending">
                <span className="status-dot"></span> Pending
              </span>
            </div>

            {registeredDoc.communicationDate && (
              <div className="success-row">
                <span className="success-label">Communication Date:</span>
                <span className="success-val font-semibold">
                  {registeredDoc.communicationDate}
                </span>
              </div>
            )}

            {registeredDoc.deadlineDate && (
              <div className="success-row">
                <span className="success-label">Deadline / Due Date:</span>
                <span className="success-val font-semibold text-amber">
                  {registeredDoc.deadlineDate}
                </span>
              </div>
            )}

            {registeredDoc.isUrgent && (
              <div className="success-row">
                <span className="success-label">Priority:</span>
                <span className="urgent-badge-neon">⚡ URGENT</span>
              </div>
            )}

            {registeredDoc.driveFileLink && registeredDoc.driveFileLink !== "#" && (
              <div className="success-row">
                <span className="success-label">Google Drive Link:</span>
                <a
                  href={
                    registeredDoc.driveFileLink.startsWith("/")
                      ? `http://localhost:5000${registeredDoc.driveFileLink}`
                      : registeredDoc.driveFileLink
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drive-link"
                >
                  <ExternalLink size={14} /> Open Document File
                </a>
              </div>
            )}
          </div>

          <div className="success-actions">
            <button className="btn btn-secondary" onClick={resetForm}>
              <RefreshCw size={16} /> Register Another Document
            </button>
            <Link to="/admin/dashboard" className="btn btn-primary">
              <span>Go to Admin Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      ) : file ? (
        /* Document Attached & Manual Entry Form */
        <div className="verification-layout">
          <div className="verification-header-banner">
            <div className="banner-content">
              <h3>Document Attached — Fill Details Below</h3>
              <p>
                File attached and ready for upload to Google Drive. Please fill in the official details manually and click Save & Register.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => setFile(null)}>
              <RefreshCw size={14} /> Choose Different File
            </button>
          </div>

          {saveError && (
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{saveError}</span>
            </div>
          )}

          <div className="verification-grid">
            {/* Left: Document File Preview */}
            <div className="content-card doc-preview-panel">
              <h3 className="section-heading">Attached Document</h3>
              <div className="file-info-bar">
                <span className="font-semibold">{file.name}</span>
                <span className="text-muted">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>

              <div className="preview-display-box">
                {previewUrl && previewUrl !== "pdf_preview" ? (
                  <img src={previewUrl} alt="Attached Document" className="preview-scan-img" />
                ) : (
                  <div className="pdf-preview-box">
                    <FileText size={56} className="text-blue" />
                    <h4>PDF Document Selected</h4>
                    <p className="text-muted">Will be uploaded to Google Drive upon registration.</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <RefreshCw size={14} /> Replace File
                </button>
              </div>
            </div>

            {/* Right: Manual Registration Form */}
            <div className="content-card verification-form-panel">
              <h3 className="section-heading">Registration Details</h3>

              {/* Reference Number */}
              <div className="form-group">
                <label className="form-label" htmlFor="refNo">
                  <Hash size={14} /> Reference Number: <span className="text-danger">*</span>
                </label>
                <input
                  id="refNo"
                  type="text"
                  className="form-input"
                  value={referenceNo}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  placeholder="Enter reference number (e.g. PH/2026/105)"
                  required
                />
              </div>

              {/* Communication Date & Deadline Date (2-column layout) */}
              <div className="date-grid-2col">
                {/* Communication Date */}
                <div className="form-group mb-0">
                  <div className="form-label-with-action">
                    <label className="form-label" htmlFor="commDate">
                      <CalendarDays size={14} /> Communication Date:
                    </label>
                    <button
                      type="button"
                      className="btn-text-action"
                      onClick={() => setCommunicationDate(getTodayFormatted())}
                    >
                      Set Today
                    </button>
                  </div>
                  <input
                    id="commDate"
                    type="date"
                    className="form-input form-input-calendar"
                    value={toDateInputValue(communicationDate)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setCommunicationDate(fromDateInputValue(e.target.value))}
                  />
                </div>

                {/* Deadline Date */}
                <div className="form-group mb-0">
                  <div className="form-label-with-action">
                    <label className="form-label" htmlFor="deadlineDate">
                      <Clock size={14} className={deadlineInfo.isNearby ? "text-danger" : ""} /> 
                      Deadline Date (Due Date):
                    </label>
                    {deadlineDate && (
                      <button
                        type="button"
                        className="btn-text-action text-danger"
                        onClick={() => setDeadlineDate("")}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <input
                    id="deadlineDate"
                    type="date"
                    className="form-input form-input-calendar"
                    value={toDateInputValue(deadlineDate)}
                    onClick={(e) => e.target.showPicker && e.target.showPicker()}
                    onChange={(e) => setDeadlineDate(fromDateInputValue(e.target.value))}
                  />
                  {/* Quick Shortcut Buttons */}
                  <div className="deadline-quick-actions">
                    <button
                      type="button"
                      className="btn-chip"
                      onClick={() => setDeadlineDate(addDaysFormatted(3))}
                    >
                      +3 Days
                    </button>
                    <button
                      type="button"
                      className="btn-chip"
                      onClick={() => setDeadlineDate(addDaysFormatted(7))}
                    >
                      +7 Days
                    </button>
                    <button
                      type="button"
                      className="btn-chip"
                      onClick={() => setDeadlineDate(addDaysFormatted(15))}
                    >
                      +15 Days
                    </button>
                    {deadlineInfo.hasDeadline && (
                      <span className={`deadline-badge ${deadlineInfo.badgeClass}`}>
                        {deadlineInfo.label}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Urgent Priority Toggle Switch */}
              <div className={`urgent-toggle-card ${isUrgent ? "active" : ""}`}>
                <div className="urgent-toggle-info">
                  <div className="urgent-toggle-icon">
                    <Zap size={20} />
                  </div>
                  <div>
                    <div className="urgent-toggle-title">
                      Urgent Institutional Priority
                    </div>
                    <div className="urgent-toggle-subtitle">
                      {isUrgent 
                        ? "⚡ Neon red glow enabled across all registers and dashboards!"
                        : "Turn on to flag as critical/urgent correspondence"}
                    </div>
                  </div>
                </div>
                <label className="switch-control" htmlFor="urgent-switch">
                  <input
                    id="urgent-switch"
                    type="checkbox"
                    checked={isUrgent}
                    onChange={(e) => setIsUrgent(e.target.checked)}
                  />
                  <span className="switch-slider"></span>
                </label>
              </div>

              {/* Autocomplete From / Sender */}
              <div className="form-group autocomplete-container" ref={senderContainerRef}>
                <label className="form-label" htmlFor="from">
                  <User size={14} /> From / Sender (Smart Suggestions as you type):
                </label>
                <div className="autocomplete-input-wrap">
                  <input
                    id="from"
                    type="text"
                    className="form-input"
                    value={fromSender}
                    autoComplete="off"
                    onFocus={() => setShowSenderSuggestions(true)}
                    onChange={(e) => {
                      setFromSender(e.target.value);
                      setShowSenderSuggestions(true);
                    }}
                    placeholder="Type or select sender (e.g. Anatomy, General Medicine, Cardiology, MRD...)"
                  />
                  {fromSender && (
                    <button
                      type="button"
                      className="autocomplete-clear-btn"
                      onClick={() => setFromSender("")}
                    >
                      &times;
                    </button>
                  )}
                </div>

                {/* Dropdown suggestions overlay */}
                {showSenderSuggestions && matchingSenders.length > 0 && (
                  <div className="autocomplete-suggestions-dropdown">
                    <div className="suggestions-header">
                      <Sparkles size={12} className="text-amber" />
                      <span>Suggested Institutional Senders ({matchingSenders.length})</span>
                    </div>
                    {matchingSenders.map((senderName) => (
                      <div
                        key={senderName}
                        className="suggestion-item"
                        onMouseDown={() => {
                          setFromSender(senderName);
                          setShowSenderSuggestions(false);
                        }}
                      >
                        <User size={13} className="text-muted" />
                        <span className="suggestion-text">
                          {renderHighlightedSender(senderName, fromSender)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Target Department Dropdown */}
              <div className="form-group">
                <label className="form-label font-bold" htmlFor="dept">
                  <Building size={14} /> Target Department / Section: <span className="text-danger">*</span>
                </label>
                <select
                  id="dept"
                  className="form-select target-dept-select"
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                >
                  <optgroup label="COLLEGE" className="optgroup-header optgroup-college">
                    {collegeSections.map((sec) => (
                      <option key={sec.name || sec} value={sec.name || sec}>
                        {sec.name || sec} {sec.description ? `— ${sec.description}` : ""}
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="HOSPITAL" className="optgroup-header optgroup-hospital">
                    {hospitalSections.map((sec) => (
                      <option key={sec.name || sec} value={sec.name || sec}>
                        {sec.name || sec} {sec.description ? `— ${sec.description}` : ""}
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Subject */}
              <div className="form-group">
                <label className="form-label" htmlFor="subject">
                  Subject:
                </label>
                <textarea
                  id="subject"
                  className="form-textarea"
                  rows={3}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter official subject matter of the letter"
                />
              </div>

              {/* Remarks */}
              <div className="form-group">
                <label className="form-label" htmlFor="remarks">
                  Initial Remarks / Instructions:
                </label>
                <input
                  id="remarks"
                  type="text"
                  className="form-input"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. For urgent review and compliance"
                />
              </div>

              {/* Actions */}
              <div className="form-actions-right">
                <button
                  className="btn btn-secondary"
                  disabled={saveLoading}
                  onClick={resetForm}
                >
                  Clear Form
                </button>
                <button
                  className="btn btn-primary btn-lg"
                  disabled={saveLoading}
                  onClick={handleSaveAndRegister}
                >
                  <Save size={18} />
                  <span>{saveLoading ? "Uploading to Drive & Sheets..." : "Save & Register Document"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Upload Card (When no file selected yet) */
        <div className="upload-container-grid">
          <div className="content-card upload-card" style={{ gridColumn: "1 / -1", maxWidth: "800px", margin: "0 auto" }}>
            <h3 className="section-heading">Select or Capture Document</h3>
            <p className="page-subtitle" style={{ marginBottom: "16px" }}>
              Upload your official letter or scanned communication. Once selected, you can fill in the details manually and register it.
            </p>

            {fileError && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{fileError}</span>
              </div>
            )}

            {/* Drag and Drop Area */}
            <div
              className={`dropzone ${isDragOver ? "drag-active" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
            >
              <UploadCloud size={48} className="dropzone-icon" />
              <h4 className="dropzone-title">Drag & drop document here</h4>
              <p className="dropzone-text">Supports PDF, JPG, JPEG, and PNG files up to 25MB</p>

              <div className="upload-btn-row">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileText size={16} /> Browse File
                </button>

                {/* Webcam capture trigger */}
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setShowCamera(true)}
                >
                  <Camera size={16} /> Capture with Camera
                </button>

                {/* Mobile / Tablet camera native trigger */}
                <button
                  type="button"
                  className="btn btn-outline btn-sm mobile-camera-btn"
                  onClick={() => mobileCameraInputRef.current?.click()}
                >
                  <Camera size={16} /> Mobile Camera
                </button>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
              <input
                ref={mobileCameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                style={{ display: "none" }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />
            </div>

            <div className="workflow-info-box" style={{ marginTop: "20px" }}>
              <h4>Standard Registration Process:</h4>
              <ol className="pipeline-steps">
                <li>Attach document (PDF or scanned image)</li>
                <li>Enter Reference No, Date, Deadline, Sender, and Department</li>
                <li>Optionally toggle Urgent Priority for neon red alert</li>
                <li>Click <strong>Save & Register</strong> to automatically upload the file to Google Drive and record it in Google Sheets</li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* Live Camera Modal */}
      {showCamera && (
        <CameraCapture
          onCapture={(capturedFile) => {
            handleFileSelect(capturedFile);
            setShowCamera(false);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
