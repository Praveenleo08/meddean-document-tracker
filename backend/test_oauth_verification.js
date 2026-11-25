/**
 * Verification test for OAuth 2.0 connection to Google Sheets & Drive under meddeanofficial@gmail.com.
 * Reads credentials strictly from process.env (or .env / .env.local).
 * Tests:
 * 1. Sheet Header Initialization & Test Row append + delete in 'Communication Register'
 * 2. Drive file upload + delete inside 'MedDean_Documents' folder
 */

require("dotenv").config();
const { google } = require("googleapis");
const stream = require("stream");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const ROOT_FOLDER_ID = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

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

async function verifyGoogleConnection() {
  console.log("=================================================");
  console.log(" Starting OAuth 2.0 Google Sheets & Drive Verification");
  console.log(" Account: meddeanofficial@gmail.com");
  console.log("=================================================");

  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN || !SHEET_ID || !ROOT_FOLDER_ID) {
    console.error("Missing required environment variables in .env");
    return { sheetSuccess: false, driveSuccess: false };
  }

  const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
  );
  oauth2Client.setCredentials({ refresh_token: REFRESH_TOKEN });

  const sheets = google.sheets({ version: "v4", auth: oauth2Client });
  const drive = google.drive({ version: "v3", auth: oauth2Client });

  let sheetSuccess = false;
  let driveSuccess = false;

  // ----------------------------------------------------------------
  // PART 1: GOOGLE SHEETS VERIFICATION
  // ----------------------------------------------------------------
  try {
    console.log("\n[TEST 1] Verifying Google Sheets connection...");
    const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
    console.log(`  ✓ Successfully connected to Spreadsheet: "${sheetMeta.data.properties.title}" (ID: ${SHEET_ID})`);

    const tabExists = sheetMeta.data.sheets.some(
      s => s.properties.title.toLowerCase() === "communication register"
    );
    console.log(`  ✓ Tab 'Communication Register' exists: ${tabExists}`);

    // Check Row 1 headers
    const headerCheck = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "'Communication Register'!A1:P1"
    });

    if (!headerCheck.data.values || headerCheck.data.values.length === 0) {
      console.log("  → Row 1 is empty. Writing 14 standard header columns (A-N) + extensions...");
      await sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: "'Communication Register'!A1:P1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [HEADERS] }
      });
      console.log("  ✓ Standard headers written successfully to Row 1.");
    } else {
      console.log("  ✓ Row 1 headers already present:", headerCheck.data.values[0].slice(0, 5), "...");
    }

    // Append a temporary test row
    const testDocId = "TEST-DOC-" + Date.now();
    const testRow = [
      testDocId,
      "TEST/REF/001",
      "25-11-2026",
      "25-11-2026",
      "OAuth Verification Script",
      "Testing Google Sheet Append & Delete Operations",
      "College - E1 section",
      "Pending",
      "Temporary verification row",
      "test_drive_id",
      "https://drive.google.com",
      "admin",
      "25-11-2026 23:00",
      "",
      "30-11-2026",
      "NO"
    ];

    console.log(`  → Appending test row for Document ID: ${testDocId}...`);
    const appendRes = await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: "'Communication Register'!A:P",
      valueInputOption: "USER_ENTERED",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [testRow] }
    });
    console.log("  ✓ Successfully appended test row. Range:", appendRes.data.updates.updatedRange);

    // Verify row was read back
    const readBack = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: "'Communication Register'!A:A"
    });
    const testRowIndex = readBack.data.values.findIndex(r => r[0] === testDocId) + 1;
    console.log(`  ✓ Confirmed test row found at row ${testRowIndex}`);

    // Delete test row to leave sheet pristine
    if (testRowIndex > 1) {
      console.log(`  → Cleaning up test row ${testRowIndex}...`);
      const targetSheet = sheetMeta.data.sheets.find(
        s => s.properties.title.toLowerCase() === "communication register"
      );
      const sheetTabId = targetSheet ? targetSheet.properties.sheetId : 0;

      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          requests: [
            {
              deleteDimension: {
                range: {
                  sheetId: sheetTabId,
                  dimension: "ROWS",
                  startIndex: testRowIndex - 1,
                  endIndex: testRowIndex
                }
              }
            }
          ]
        }
      });
      console.log(`  ✓ Successfully deleted test row ${testRowIndex}. Sheet remains clean!`);
    }

    sheetSuccess = true;
  } catch (err) {
    console.error("  ✗ Google Sheets Test Failed:", err.message, err.response?.data || "");
  }

  // ----------------------------------------------------------------
  // PART 2: GOOGLE DRIVE VERIFICATION
  // ----------------------------------------------------------------
  try {
    console.log("\n[TEST 2] Verifying Google Drive connection...");
    const folderRes = await drive.files.get({
      fileId: ROOT_FOLDER_ID,
      fields: "id, name, mimeType"
    });
    console.log(`  ✓ Successfully accessed Root Folder: "${folderRes.data.name}" (ID: ${ROOT_FOLDER_ID})`);

    // Upload small test file
    console.log("  → Uploading small test text file into MedDean_Documents...");
    const testFileContent = "MedDean Document Tracker OAuth Verification - " + new Date().toISOString();
    const bufferStream = new stream.PassThrough();
    bufferStream.end(Buffer.from(testFileContent, "utf-8"));

    const uploadRes = await drive.files.create({
      requestBody: {
        name: `test_verification_${Date.now()}.txt`,
        parents: [ROOT_FOLDER_ID],
        description: "Temporary verification file for MedDean Document Tracker"
      },
      media: {
        mimeType: "text/plain",
        body: bufferStream
      },
      fields: "id, name, webViewLink"
    });

    const uploadedFileId = uploadRes.data.id;
    console.log(`  ✓ Successfully uploaded test file "${uploadRes.data.name}" (ID: ${uploadedFileId})`);
    console.log(`    View Link: ${uploadRes.data.webViewLink}`);

    // Delete test file
    console.log(`  → Deleting test file ${uploadedFileId}...`);
    await drive.files.delete({ fileId: uploadedFileId });
    console.log(`  ✓ Successfully deleted test file. Drive root folder remains clean!`);

    driveSuccess = true;
  } catch (err) {
    console.error("  ✗ Google Drive Test Failed:", err.message, err.response?.data || "");
  }

  console.log("\n=================================================");
  console.log(` OVERALL RESULT:`);
  console.log(` Google Sheets OAuth: ${sheetSuccess ? "PASSED (100%)" : "FAILED"}`);
  console.log(` Google Drive OAuth:  ${driveSuccess ? "PASSED (100%)" : "FAILED"}`);
  console.log("=================================================");

  return { sheetSuccess, driveSuccess };
}

verifyGoogleConnection();
