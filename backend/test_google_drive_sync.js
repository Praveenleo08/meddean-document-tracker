/**
 * Google Drive Diagnostic & Connection Verification Tool
 * Run: node test_google_drive_sync.js
 */

require("dotenv").config();
const googleDriveService = require("./services/googleDriveService");

async function runDriveDiagnostics() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Google Drive Diagnostic & Verification");
  console.log("==============================================================================");

  console.log("\n[1] Configuration Check:");
  console.log(` - OAuth Client ID:        ${process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + "..." : "(Not set)"}`);
  console.log(` - Configured Root Folder: ${process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || "(Not set - will auto-create MedDean_Documents)"}`);
  console.log(` - Drive Client Ready:     ${googleDriveService.isConfigured ? "YES (OAuth 2.0 Live)" : "NO"}`);

  if (!googleDriveService.isConfigured) {
    console.log("\n[!] Google Drive client not configured. Please check .env.");
    return;
  }

  console.log("\n[2] Testing Google Drive API Connectivity...");
  try {
    const rootFolderId = await googleDriveService.findOrCreateRootFolder();
    console.log(`  ✓ Root folder found/created: ID = ${rootFolderId}`);

    console.log("\n[3] Testing Department Subfolder Auto-Creation ('College - E1 section')...");
    const deptFolderId = await googleDriveService.findOrCreateDepartmentFolder("College - E1 section");
    console.log(`  ✓ Department subfolder found/created: ID = ${deptFolderId}`);

    console.log("\n[4] Testing Document Upload Simulation...");
    const sampleBuffer = Buffer.from("MedDean Sample Document Content for Verification - " + new Date().toISOString(), "utf-8");
    const uploadResult = await googleDriveService.uploadDocument({
      buffer: sampleBuffer,
      mimeType: "text/plain",
      filename: `diagnostic_test_${Date.now()}.txt`,
      department: "College - E1 section",
      documentId: "DIAG-TEST-001"
    });

    console.log(`  ✓ Upload successful!`);
    console.log(`    - File ID:   ${uploadResult.driveFileId}`);
    console.log(`    - File Link: ${uploadResult.driveFileLink}`);
    console.log(`    - Is Remote: ${uploadResult.isRemote}`);

    // Clean up test file from Drive
    if (uploadResult.isRemote && googleDriveService.driveClient) {
      console.log(`\n[5] Cleaning up test file (${uploadResult.driveFileId})...`);
      await googleDriveService.driveClient.files.delete({ fileId: uploadResult.driveFileId });
      console.log(`  ✓ Test file cleaned up successfully.`);
    }

    console.log("\n==============================================================================");
    console.log(" >>> SUCCESS: Google Drive OAuth 2.0 is fully operational! <<<");
    console.log("==============================================================================");
  } catch (err) {
    console.error("Diagnostic error:", err.message);
  }
}

runDriveDiagnostics();
