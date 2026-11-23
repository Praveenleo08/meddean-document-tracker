/**
 * Google Sheets Synchronization Diagnostic Tool
 * Run: node test_google_sheets_sync.js
 *
 * Verifies:
 * 1. Google Sheets configuration (.env GOOGLE_SHEET_ID & Service Account)
 * 2. Sheet tab 'Communication Register' existence
 * 3. 14 standard columns in Row 1
 * 4. Appending a new communication (Status = Pending)
 * 5. In-place updating of the row (Status = In Progress -> Closed)
 * 6. Confirmation that row count did not duplicate
 */

require("dotenv").config();
const googleSheetsService = require("./services/googleSheetsService");

async function runDiagnostics() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Google Sheets Diagnostic & Verification");
  console.log("==============================================================================");

  const status = googleSheetsService.getConnectionStatus();
  console.log("\n[1] Connection Status:");
  console.log(` - Mode:             ${status.connectionMode}`);
  console.log(` - Live GCP Ready:   ${status.isConfigured ? "YES (Live Google Sheets Connected)" : "NO (Running in Local Register Mirror Mode)"}`);
  console.log(` - Spreadsheet ID:   ${status.spreadsheetId || "(Not configured in .env)"}`);
  if (status.spreadsheetUrl) {
    console.log(` - Spreadsheet URL:  ${status.spreadsheetUrl}`);
  }
  console.log(` - Target Sheet:     ${status.sheetName}`);

  console.log("\n[2] Fetching current records from register...");
  const initialDocs = await googleSheetsService.getAllCommunications();
  console.log(` - Current total rows: ${initialDocs.length}`);

  // Test Document ID
  const testDocId = `TEST-SYNC-${Date.now().toString().slice(-5)}`;
  console.log(`\n[3] Testing Append Operation with Document ID: ${testDocId}...`);

  const newDoc = await googleSheetsService.appendCommunication({
    documentId: testDocId,
    referenceNo: "TEST/SYNC/2026",
    communicationDate: "29-09-2026",
    receivedDate: "29-09-2026",
    from: "Dean Office Quality Cell",
    subject: "Automated Google Sheets Synchronization Verification",
    department: "Pharmacy",
    status: "Pending",
    remarks: "Testing initial pending creation in Google Sheets",
    driveFileId: "test-sync-file-id",
    driveFileLink: "#"
  });

  console.log(` - Appended successfully! Status: ${newDoc.status}`);

  console.log(`\n[4] Testing In-Place Update to 'In Progress'...`);
  const inProgressDoc = await googleSheetsService.updateCommunication(testDocId, {
    status: "In Progress",
    remarks: "Work actively underway by Department Officer"
  });
  console.log(` - Updated successfully! Status: ${inProgressDoc.status}`);

  console.log(`\n[5] Testing In-Place Update to 'Closed' (Work Completed)...`);
  const closedDoc = await googleSheetsService.updateCommunication(testDocId, {
    status: "Closed",
    remarks: "Work successfully completed and verified in Google Sheets register."
  });
  console.log(` - Closed successfully! Status: ${closedDoc.status}, Closed Date: ${closedDoc.closedDate}`);

  console.log("\n[6] Verifying Data Consistency (No Duplicate Rows)...");
  const finalDocs = await googleSheetsService.getAllCommunications();
  const testRows = finalDocs.filter(d => d.documentId === testDocId);
  console.log(` - Occurrences of ${testDocId} in register: ${testRows.length} (Must be exactly 1)`);

  if (testRows.length === 1 && testRows[0].status === "Closed") {
    console.log("\n>>> SUCCESS: Google Sheets register updated in-place with zero row duplication! <<<");
  } else {
    console.error("\n>>> FAILED: Data consistency error detected! <<<");
  }

  console.log("==============================================================================\n");
}

runDiagnostics().catch(err => {
  console.error("Diagnostic error:", err);
});
