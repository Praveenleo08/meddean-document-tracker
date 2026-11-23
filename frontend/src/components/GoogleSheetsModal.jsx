import React, { useState, useEffect } from "react";
import api from "../services/api";
import {
  FileSpreadsheet,
  CheckCircle2,
  ExternalLink,
  X,
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";

export default function GoogleSheetsModal({ onClose }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard/sheets-status");
      if (res.data?.success) {
        setStatus(res.data.sheetsStatus);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleCopyEnv = () => {
    const template = `GOOGLE_SHEET_ID=your_spreadsheet_id_here\nGOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json`;
    navigator.clipboard.writeText(template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container sheets-status-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <FileSpreadsheet size={22} className="text-emerald" />
            <h2 className="modal-title">Google Sheets Live Central Register</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body-padding">
          {/* Status Banner */}
          <div
            className={`connection-banner ${
              status?.isConfigured ? "banner-connected" : "banner-local"
            }`}
          >
            <div className="banner-icon">
              {status?.isConfigured ? (
                <CheckCircle2 size={32} className="text-emerald" />
              ) : (
                <HelpCircle size={32} className="text-amber" />
              )}
            </div>
            <div>
              <h3 className="banner-title">
                {status?.isConfigured
                  ? "Live Google Sheets API Connected"
                  : "Running in Synchronized Local Register Mode"}
              </h3>
              <p className="banner-sub">
                {status?.isConfigured
                  ? "Every document uploaded and work status update is writing directly to your Google Spreadsheet in real-time."
                  : "All records and updates follow the exact 14-column Google Sheet schema and synchronize locally. To connect your live Google Sheet, add your GOOGLE_SHEET_ID in backend/.env."}
              </p>
            </div>
          </div>

          {/* Details Table */}
          <div className="sheets-info-table mt-4">
            <div className="info-row">
              <span className="info-lbl">Target Spreadsheet:</span>
              <span className="info-val font-semibold">
                MedDean_Communication_Register
              </span>
            </div>

            <div className="info-row">
              <span className="info-lbl">Main Sheet Tab:</span>
              <span className="info-val font-mono">
                {status?.sheetName || "Communication Register"}
              </span>
            </div>

            <div className="info-row">
              <span className="info-lbl">Spreadsheet ID:</span>
              <span className="info-val font-mono text-xs">
                {status?.spreadsheetId || "Not set (using backend/data/googleSheetsRegister.json)"}
              </span>
            </div>

            {status?.spreadsheetUrl && (
              <div className="info-row">
                <span className="info-lbl">Live Spreadsheet Link:</span>
                <a
                  href={status.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="drive-link"
                >
                  <ExternalLink size={14} /> Open in Google Sheets
                </a>
              </div>
            )}

            <div className="info-row">
              <span className="info-lbl">Row Consistency:</span>
              <span className="info-val text-emerald font-semibold">
                Strict 1-Row Per Document (In-Place Row Updates)
              </span>
            </div>
          </div>

          {/* Canonical 14 Columns */}
          <div className="columns-breakdown mt-4">
            <h4 className="section-subtitle">Canonical 14 Columns in Logical Order:</h4>
            <div className="columns-badges-wrap">
              {[
                "1. Document ID",
                "2. Reference No",
                "3. Communication Date",
                "4. Received Date",
                "5. From",
                "6. Subject",
                "7. Department",
                "8. Status",
                "9. Remarks",
                "10. Drive File ID",
                "11. Drive File Link",
                "12. Uploaded By",
                "13. Last Updated",
                "14. Closed Date"
              ].map((col, idx) => (
                <span key={idx} className="col-badge">
                  {col}
                </span>
              ))}
            </div>
          </div>

          {/* How to Connect Live Google Sheet */}
          <div className="gcp-quick-guide mt-4">
            <h4 className="section-subtitle">How to Connect Your Live Google Sheet:</h4>
            <ol className="guide-steps">
              <li>
                Create a spreadsheet in Google Sheets named{" "}
                <strong>MedDean_Communication_Register</strong>.
              </li>
              <li>
                Copy the Spreadsheet ID from its URL:{" "}
                <code>https://docs.google.com/spreadsheets/d/<b>[SPREADSHEET_ID]</b>/edit</code>
              </li>
              <li>
                Create a Google Cloud Service Account, download the JSON key, and share the
                sheet with your service account email as <strong>Editor</strong>.
              </li>
              <li>
                In <code>backend/.env</code>, paste your credentials:
                <div className="code-snippet-box">
                  <code>
                    GOOGLE_SHEET_ID=your_spreadsheet_id<br />
                    GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json
                  </code>
                  <button className="copy-btn" onClick={handleCopyEnv}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary btn-sm" onClick={fetchStatus}>
            <RefreshCw size={14} /> Refresh Connection Status
          </button>
          <button className="btn btn-primary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
