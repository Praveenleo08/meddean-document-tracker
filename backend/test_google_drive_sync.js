/**
 * Google Drive Diagnostic & Connection Verification Tool
 * Run: node test_google_drive_sync.js
 */

require("dotenv").config();
const path = require("path");
const fs = require("fs");
const googleDriveService = require("./services/googleDriveService");

async function runDriveDiagnostics() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Google Drive Diagnostic & Verification");
  console.log("==============================================================================");

  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  let serviceAccountEmail = "(Not found)";
  let projectId = "(Not found)";

  if (keyPath) {
    try {
      const resolved = path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
      if (fs.existsSync(resolved)) {
        const keyData = JSON.parse(fs.readFileSync(resolved, "utf-8"));
        serviceAccountEmail = keyData.client_email;
        projectId = keyData.project_id;
      }
    } catch (e) {}
  }

  console.log("\n[1] Configuration Check:");
  console.log(` - Service Account Email: ${serviceAccountEmail}`);
  console.log(` - GCP Project ID:         ${projectId}`);
  console.log(` - Key File Path:          ${keyPath}`);
  console.log(` - Configured Root Folder: ${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "(Not set - will auto-create MedDean_Documents)"}`);
  console.log(` - Drive Client Ready:     ${googleDriveService.isConfigured ? "YES" : "NO"}`);

  if (!googleDriveService.isConfigured) {
    console.log("\n[!] Service account key file not found or invalid. Please check .env.");
    return;
  }

  console.log("\n[2] Testing Google Drive API Connectivity...");
  try {
    const rootFolderId = await googleDriveService.findOrCreateRootFolder();
    if (rootFolderId === "local-root-folder") {
      console.log("\n[X] Google Drive API is NOT enabled or connection failed!");
      console.log("    To fix this:");
      console.log("    1. Open Google Cloud Console: https://console.developers.google.com/apis/api/drive.googleapis.com/overview?project=" + projectId);
      console.log("    2. Click 'ENABLE' for Google Drive API.");
      console.log("    3. If you want the files to appear in YOUR personal Google Drive:");
      console.log("       a) Go to https://drive.google.com");
      console.log("       b) Create a folder named 'MedDean_Documents'");
      console.log("       c) Share the folder with: " + serviceAccountEmail + " (as Editor)");
      console.log("       d) Copy the Folder ID from the URL and add to .env:");
      console.log("          GOOGLE_DRIVE_ROOT_FOLDER_ID=your_folder_id_here");
      return;
    }

    console.log(` - Root Folder 'MedDean_Documents' ID: ${rootFolderId}`);

    console.log("\n[3] Testing Department Subfolder Access (Pharmacy)...");
    const deptFolderId = await googleDriveService.findOrCreateDepartmentFolder("Pharmacy");
    console.log(` - Department 'Pharmacy' Folder ID: ${deptFolderId}`);

    console.log("\n[4] Testing Upload to Google Drive...");
    const sampleBuffer = Buffer.from(
      "MedDean Document Tracker - Test verification file created at " + new Date().toISOString()
    );
    const testDocId = `TEST-DRIVE-${Date.now().toString().slice(-5)}`;
    const uploadResult = await googleDriveService.uploadDocument({
      buffer: sampleBuffer,
      mimeType: "text/plain",
      filename: `${testDocId}_Verification.txt`,
      department: "Pharmacy",
      documentId: testDocId
    });

    console.log("\n[5] Upload Result:");
    console.log(` - Remote Drive File: ${uploadResult.isRemote ? "YES (Saved to Google Drive!)" : "NO (Fell back to local storage)"}`);
    console.log(` - Drive File ID:     ${uploadResult.driveFileId}`);
    console.log(` - Drive File Link:   ${uploadResult.driveFileLink}`);
    
    if (uploadResult.isRemote) {
      console.log("\n>>> SUCCESS: Google Drive is LIVE and storing documents directly in Google Drive! <<<");
    } else {
      console.log("\n[!] File was saved locally because Google Drive upload failed.");
    }
  } catch (err) {
    console.error("\n[X] Error during Google Drive diagnostic:", err.message);
  }
  console.log("==============================================================================\n");
}

runDriveDiagnostics();
