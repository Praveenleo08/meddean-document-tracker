/**
 * Google Sheets Service for MedDean Document Tracker.
 * Manages the single central register: 'MedDean_Communication_Register', Sheet: 'Communication Register'.
 * Enforces single-row-per-document rule using Document ID as unique primary key.
 */

const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const { DEPARTMENTS } = require("../config/departments");
const { formatDateReadable, formatDateTimeReadable } = require("../utils/dateUtils");

const SHEET_NAME = "Communication Register";
const HEADERS = [
  "Document ID",
  "Reference No",
  "Communication Date",
  "Received Date",
  "From",
  "Subject",
  "Department",
  "Status",
  "Remarks",
  "Drive File ID",
  "Drive File Link",
  "Uploaded By",
  "Last Updated",
  "Closed Date",
  "Deadline Date",
  "Urgent"
];

class GoogleSheetsService {
  constructor() {
    this.sheetsClient = null;
    this.spreadsheetId = process.env.GOOGLE_SHEET_ID || null;
    this.isConfigured = false;
    this.lastSyncTime = null;
    this.connectionMode = "LOCAL_SIMULATION";

    // Local mirror register file for offline / development / immediate testing
    this.dataPath = path.resolve(__dirname, "../data");
    this.registerFile = path.resolve(this.dataPath, "googleSheetsRegister.json");

    this.initLocalRegister();
    this.initGoogleClient();
  }

  /**
   * Initializes local register with demo data if not existing
   */
  initLocalRegister() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }

    if (!fs.existsSync(this.registerFile)) {
      this.writeLocalRegister([]);
    }
  }

  /**
   * Initializes Google Sheets API client with Service Account or OAuth 2.0
   */
  initGoogleClient() {
    try {
      this.spreadsheetId = process.env.GOOGLE_SHEET_ID || null;
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

      // 1. Service Account via JSON string
      if (serviceAccountJson && this.spreadsheetId) {
        try {
          const credentials = JSON.parse(serviceAccountJson);
          const auth = new google.auth.GoogleAuth({
            credentials,
            scopes: ["https://www.googleapis.com/auth/spreadsheets"]
          });
          this.sheetsClient = google.sheets({ version: "v4", auth });
          this.isConfigured = true;
          this.connectionMode = "LIVE_GOOGLE_SHEETS";
          console.log(`[Google Sheets] Connected LIVE to Spreadsheet ID: ${this.spreadsheetId} via Service Account JSON.`);
          this.ensureHeadersExist();
          return;
        } catch (e) {
          console.warn("[Google Sheets] Invalid GOOGLE_SERVICE_ACCOUNT_JSON:", e.message);
        }
      }

      // 2. Service Account via JSON file path
      let resolvedPath = null;
      const candidates = [
        serviceAccountPath,
        serviceAccountPath ? path.resolve(__dirname, "../", serviceAccountPath) : null,
        serviceAccountPath ? path.resolve(process.cwd(), serviceAccountPath) : null,
        path.resolve(__dirname, "../config/google-service-account.json"),
        path.resolve(__dirname, "../config/google-service-account.json.json")
      ];
      for (const c of candidates) {
        if (c && fs.existsSync(c)) {
          resolvedPath = c;
          break;
        }
      }

      if (resolvedPath && this.spreadsheetId) {
        const auth = new google.auth.GoogleAuth({
          keyFile: resolvedPath,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });
        this.sheetsClient = google.sheets({ version: "v4", auth });
        this.isConfigured = true;
        this.connectionMode = "LIVE_GOOGLE_SHEETS";
        console.log(`[Google Sheets] Connected LIVE to Spreadsheet ID: ${this.spreadsheetId} via Service Account Key file: ${resolvedPath}`);
        this.ensureHeadersExist();
        return;
      }

      // 3. OAuth 2.0 Credentials
      if (clientId && clientSecret && refreshToken && this.spreadsheetId) {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/api/auth/google/callback"
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.sheetsClient = google.sheets({ version: "v4", auth: oauth2Client });
        this.isConfigured = true;
        this.connectionMode = "LIVE_GOOGLE_SHEETS";
        console.log(`[Google Sheets] Connected LIVE to Spreadsheet ID: ${this.spreadsheetId} via OAuth 2.0.`);
        this.ensureHeadersExist();
        return;
      }

      // Default: Local Register mode
      this.isConfigured = false;
      this.connectionMode = "LOCAL_SIMULATION";
      console.log("[Google Sheets] Operating in Local Register Mode. (Set GOOGLE_SHEET_ID and Service Account in .env for live sync)");
    } catch (err) {
      console.warn("[Google Sheets] Initialization note:", err.message);
      this.isConfigured = false;
      this.connectionMode = "LOCAL_SIMULATION";
    }
  }

  /**
   * Ensures the sheet tab exists and has the standard 14 headers in Row 1
   */
  async ensureHeadersExist() {
    if (!this.isConfigured || !this.sheetsClient || !this.spreadsheetId) return;

    try {
      // 1. Check if SHEET_NAME tab exists
      const meta = await this.sheetsClient.spreadsheets.get({
        spreadsheetId: this.spreadsheetId
      });
      const sheetExists = meta.data.sheets.some(
        s => s.properties.title.toLowerCase() === SHEET_NAME.toLowerCase()
      );

      if (!sheetExists) {
        console.log(`[Google Sheets] Creating sheet tab: '${SHEET_NAME}'...`);
        await this.sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId: this.spreadsheetId,
          requestBody: {
            requests: [
              {
                addSheet: {
                  properties: {
                    title: SHEET_NAME,
                    gridProperties: {
                      frozenRowCount: 1
                    }
                  }
                }
              }
            ]
          }
        });
      }

      // 2. Check if headers are in Row 1
      const headerRes = await this.sheetsClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAME}!A1:P1`
      });

      if (!headerRes.data.values || headerRes.data.values.length === 0 || headerRes.data.values[0].length < HEADERS.length) {
        console.log(`[Google Sheets] Updating ${HEADERS.length} standard headers to ${SHEET_NAME} Row 1...`);
        await this.sheetsClient.spreadsheets.values.update({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAME}!A1:P1`,
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [HEADERS]
          }
        });
      }
    } catch (err) {
      console.warn("[Google Sheets] ensureHeadersExist warning:", err.message);
    }
  }

  /**
   * Finds the exact 1-based row number in live Google Sheet for a Document ID
   * @param {string} documentId
   * @returns {Promise<number|null>} 1-based row number (e.g. 5 for row 5) or null if not found
   */
  async findRowIndexInSheet(documentId) {
    if (!this.isConfigured || !this.sheetsClient || !this.spreadsheetId) return null;

    try {
      const res = await this.sheetsClient.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: `${SHEET_NAME}!A:A`
      });

      const rows = res.data.values || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] && rows[i][0].toString().trim().toLowerCase() === documentId.toLowerCase()) {
          return i + 1; // 1-based row index in sheet
        }
      }
    } catch (err) {
      console.warn("[Google Sheets] findRowIndexInSheet error:", err.message);
    }
    return null;
  }

  readLocalRegister() {
    try {
      if (fs.existsSync(this.registerFile)) {
        return JSON.parse(fs.readFileSync(this.registerFile, "utf-8"));
      }
    } catch (e) {
      console.error("[Google Sheets] Error reading register file:", e);
    }
    return [];
  }

  writeLocalRegister(data) {
    try {
      fs.writeFileSync(this.registerFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("[Google Sheets] Error writing register file:", e);
    }
  }

  recordToRow(rec) {
    return [
      rec.documentId || "",
      rec.referenceNo || "",
      rec.communicationDate || "",
      rec.receivedDate || "",
      rec.from || "",
      rec.subject || "",
      rec.department || "",
      rec.status || "Pending",
      rec.remarks || "",
      rec.driveFileId || "",
      rec.driveFileLink || "",
      rec.uploadedBy || "",
      rec.lastUpdated || "",
      rec.closedDate || "",
      rec.deadlineDate || "",
      rec.isUrgent ? "YES" : "NO"
    ];
  }

  rowToRecord(row) {
    return {
      documentId: row[0] || "",
      referenceNo: row[1] || "",
      communicationDate: row[2] || "",
      receivedDate: row[3] || "",
      from: row[4] || "",
      subject: row[5] || "",
      department: row[6] || "",
      status: row[7] || "Pending",
      remarks: row[8] || "",
      driveFileId: row[9] || "",
      driveFileLink: row[10] || "",
      uploadedBy: row[11] || "",
      lastUpdated: row[12] || "",
      closedDate: row[13] || "",
      deadlineDate: row[14] || "",
      isUrgent: row[15] === "YES" || row[15] === true || false
    };
  }

  /**
   * Retrieves all communications from register.
   * If live Google Sheet is configured, syncs directly from Google Sheet.
   */
  async getAllCommunications() {
    if (this.isConfigured && this.sheetsClient && this.spreadsheetId) {
      try {
        const res = await this.sheetsClient.spreadsheets.values.get({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAME}!A2:P`
        });
        const rows = res.data.values || [];
        const records = rows
          .filter(r => r && r[0] && r[0].toString().trim())
          .map(r => this.rowToRecord(r));
        
        this.lastSyncTime = new Date().toISOString();
        // Keep local mirror updated
        if (records.length > 0) {
          this.writeLocalRegister(records);
        }
        return records;
      } catch (err) {
        console.warn("[Google Sheets] Remote fetch failed, falling back to local register:", err.message);
      }
    }

    return this.readLocalRegister();
  }

  /**
   * Finds communication record by Document ID
   */
  async findCommunicationByDocumentId(documentId) {
    const all = await this.getAllCommunications();
    return all.find(r => r.documentId.toLowerCase() === documentId.toLowerCase()) || null;
  }

  /**
   * Appends a new communication record to Google Sheet.
   * Ensures exactly one row is added to Google Sheet.
   * Status defaults to 'Pending'.
   */
  async appendCommunication(record) {
    const all = this.readLocalRegister();

    // Check for duplicate Document ID
    const existing = all.find(r => r.documentId.toLowerCase() === record.documentId.toLowerCase());
    if (existing) {
      throw new Error(`Document with ID ${record.documentId} already exists in register.`);
    }

    const newRecord = {
      documentId: record.documentId,
      referenceNo: record.referenceNo || "",
      communicationDate: record.communicationDate || formatDateReadable(),
      receivedDate: record.receivedDate || formatDateReadable(),
      from: record.from || "",
      subject: record.subject || "",
      department: record.department,
      status: "Pending",
      remarks: record.remarks || "",
      driveFileId: record.driveFileId || "",
      driveFileLink: record.driveFileLink || "",
      uploadedBy: record.uploadedBy || "admin",
      lastUpdated: formatDateTimeReadable(),
      closedDate: "",
      deadlineDate: record.deadlineDate || "",
      isUrgent: record.isUrgent === true || record.isUrgent === "YES" || false
    };

    // Update local mirror register
    all.unshift(newRecord);
    this.writeLocalRegister(all);

    // Sync to live Google Sheet
    if (this.isConfigured && this.sheetsClient && this.spreadsheetId) {
      try {
        await this.ensureHeadersExist();
        const row = this.recordToRow(newRecord);
        const appendRes = await this.sheetsClient.spreadsheets.values.append({
          spreadsheetId: this.spreadsheetId,
          range: `${SHEET_NAME}!A:P`,
          valueInputOption: "USER_ENTERED",
          insertDataOption: "INSERT_ROWS",
          requestBody: {
            values: [row]
          }
        });
        console.log(`[Google Sheets] Successfully appended row for ${newRecord.documentId} to Google Sheet.`);
        this.lastSyncTime = new Date().toISOString();
      } catch (err) {
        console.error("[Google Sheets] Live append failed:", err.message);
      }
    }

    return newRecord;
  }

  /**
   * Updates an EXISTING communication row in Google Sheets identified by Document ID.
   * CRITICAL DATA CONSISTENCY RULE:
   * Finds the exact row in Google Sheet and updates it in place.
   * NEVER creates a duplicate row.
   */
  async updateCommunication(documentId, updates) {
    const all = this.readLocalRegister();
    const index = all.findIndex(r => r.documentId.toLowerCase() === documentId.toLowerCase());

    if (index === -1) {
      throw new Error(`Document ID ${documentId} not found in register.`);
    }

    const current = all[index];
    const updated = {
      ...current,
      ...updates,
      documentId: current.documentId, // Prevent modifying primary key
      lastUpdated: formatDateTimeReadable()
    };

    // If status is transitioning to Closed, record closedDate
    if (updates.status === "Closed" && !current.closedDate) {
      updated.closedDate = formatDateReadable();
    } else if (updates.status && updates.status !== "Closed") {
      updated.closedDate = "";
    }

    all[index] = updated;
    this.writeLocalRegister(all);

    // Sync in-place row update to live Google Sheet
    if (this.isConfigured && this.sheetsClient && this.spreadsheetId) {
      try {
        const liveRowNumber = await this.findRowIndexInSheet(documentId);
        if (liveRowNumber) {
          const row = this.recordToRow(updated);
          await this.sheetsClient.spreadsheets.values.update({
            spreadsheetId: this.spreadsheetId,
            range: `${SHEET_NAME}!A${liveRowNumber}:P${liveRowNumber}`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [row]
            }
          });
          console.log(`[Google Sheets] Updated row ${liveRowNumber} in-place for ${documentId}. Status: ${updated.status}`);
          this.lastSyncTime = new Date().toISOString();
        } else {
          // If row wasn't in sheet yet, append it once
          console.log(`[Google Sheets] Row not found in sheet for ${documentId}, appending row...`);
          await this.sheetsClient.spreadsheets.values.append({
            spreadsheetId: this.spreadsheetId,
            range: `${SHEET_NAME}!A:P`,
            valueInputOption: "USER_ENTERED",
            requestBody: {
              values: [this.recordToRow(updated)]
            }
          });
        }
      } catch (err) {
        console.error("[Google Sheets] Live row update failed:", err.message);
      }
    }

    return updated;
  }

  /**
   * Gets pending communications for a specific department
   */
  async getPendingCommunicationsByDepartment(department) {
    const all = await this.getAllCommunications();
    return all.filter(r => 
      r.department.toLowerCase() === department.toLowerCase() &&
      r.status === "Pending"
    );
  }

  /**
   * Gets all communications for a specific department
   */
  async getAllCommunicationsByDepartment(department) {
    const all = await this.getAllCommunications();
    return all.filter(r => r.department.toLowerCase() === department.toLowerCase());
  }

  /**
   * Generates department KPI summary
   */
  async getDepartmentSummary() {
    const all = await this.getAllCommunications();
    const summary = {};

    for (const dept of DEPARTMENTS) {
      summary[dept] = {
        department: dept,
        total: 0,
        pending: 0,
        inProgress: 0,
        submittedForClosure: 0,
        closed: 0,
        urgent: 0
      };
    }

    for (const rec of all) {
      if (!summary[rec.department]) {
        summary[rec.department] = {
          department: rec.department,
          total: 0,
          pending: 0,
          inProgress: 0,
          submittedForClosure: 0,
          closed: 0,
          urgent: 0
        };
      }
      summary[rec.department].total += 1;
      const st = (rec.status || "").toLowerCase();
      if (st === "pending") summary[rec.department].pending += 1;
      else if (st === "in progress") summary[rec.department].inProgress += 1;
      else if (st === "submitted for closure" || st === "submitted for review") summary[rec.department].submittedForClosure += 1;
      else if (st === "closed") summary[rec.department].closed += 1;

      if ((rec.isUrgent === true || rec.isUrgent === "YES") && st !== "closed") {
        summary[rec.department].urgent += 1;
      }
    }

    return Object.values(summary);
  }

  /**
   * Overall system metrics
   */
  async getOverallMetrics() {
    const all = await this.getAllCommunications();
    const total = all.length;
    const pending = all.filter(r => (r.status || "").toLowerCase() === "pending").length;
    const inProgress = all.filter(r => (r.status || "").toLowerCase() === "in progress").length;
    const submittedForClosure = all.filter(r => {
      const st = (r.status || "").toLowerCase();
      return st === "submitted for closure" || st === "submitted for review";
    }).length;
    const closed = all.filter(r => (r.status || "").toLowerCase() === "closed").length;
    const urgent = all.filter(r => (r.isUrgent === true || r.isUrgent === "YES") && (r.status || "").toLowerCase() !== "closed").length;

    return {
      total,
      pending,
      inProgress,
      submittedForClosure,
      closed,
      urgent
    };
  }

  /**
   * Connection status report for UI and diagnostic verification
   */
  getConnectionStatus() {
    return {
      isConfigured: this.isConfigured,
      connectionMode: this.connectionMode,
      spreadsheetId: this.spreadsheetId,
      spreadsheetUrl: this.spreadsheetId ? `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}` : null,
      sheetName: SHEET_NAME,
      lastSyncTime: this.lastSyncTime,
      headers: HEADERS
    };
  }
}

module.exports = new GoogleSheetsService();
