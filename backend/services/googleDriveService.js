/**
 * Google Drive Service for MedDean Document Tracker.
 * Handles folder structure (Root: MedDean_Documents, Subfolders per Department),
 * document uploads, secure link generation, and local fallback storage.
 */

require("dotenv").config();
const { google } = require("googleapis");
const fs = require("fs");
const path = require("path");
const stream = require("stream");
const { v4: uuidv4 } = require("uuid");
const { DEPARTMENTS } = require("../config/departments");

class GoogleDriveService {
  constructor() {
    this.driveClient = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || null;
    this.departmentFolderMap = new Map();
    this.isConfigured = false;
    
    // Local storage path for offline / development fallback
    this.localStorageDir = path.resolve(__dirname, "../meddean-drive-storage");
    this.metadataFile = path.resolve(this.localStorageDir, "drive_files_metadata.json");

    this.initLocalStorage();
    this.initGoogleClient();
  }

  /**
   * Initializes local storage directories for all departments
   */
  initLocalStorage() {
    if (!fs.existsSync(this.localStorageDir)) {
      fs.mkdirSync(this.localStorageDir, { recursive: true });
    }
    for (const dept of DEPARTMENTS) {
      const deptDir = path.join(this.localStorageDir, dept);
      if (!fs.existsSync(deptDir)) {
        fs.mkdirSync(deptDir, { recursive: true });
      }
    }
    if (!fs.existsSync(this.metadataFile)) {
      fs.writeFileSync(this.metadataFile, JSON.stringify({}, null, 2), "utf-8");
    }
  }

  /**
   * Initializes Google Drive API client using OAuth2 or Service Account
   */
  initGoogleClient() {
    try {
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      const serviceAccountPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;

      let resolvedKeyPath = null;
      if (serviceAccountPath) {
        if (path.isAbsolute(serviceAccountPath) && fs.existsSync(serviceAccountPath)) {
          resolvedKeyPath = serviceAccountPath;
        } else if (fs.existsSync(path.resolve(process.cwd(), serviceAccountPath))) {
          resolvedKeyPath = path.resolve(process.cwd(), serviceAccountPath);
        } else if (fs.existsSync(path.resolve(__dirname, "..", serviceAccountPath))) {
          resolvedKeyPath = path.resolve(__dirname, "..", serviceAccountPath);
        }
      }

      if (clientId && clientSecret && refreshToken) {
        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          process.env.GOOGLE_REDIRECT_URI || "http://localhost:8999/oauth2callback"
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });
        this.driveClient = google.drive({ version: "v3", auth: oauth2Client });
        this.isConfigured = true;
        console.log("[Google Drive] Initialized via User OAuth 2.0 Credentials (Using 15 GB Personal Drive Quota).");
      } else if (resolvedKeyPath) {
        const auth = new google.auth.GoogleAuth({
          keyFile: resolvedKeyPath,
          scopes: ["https://www.googleapis.com/auth/drive"]
        });
        this.driveClient = google.drive({ version: "v3", auth });
        this.isConfigured = true;
        console.log("[Google Drive] Initialized via Service Account Key file:", resolvedKeyPath);
      } else {
        console.log("[Google Drive] Running in Local Storage Mode (configure GOOGLE_CLIENT_ID or GOOGLE_SERVICE_ACCOUNT_KEY_PATH in .env for live Drive sync).");
      }
    } catch (err) {
      console.warn("[Google Drive] Initialization note:", err.message);
      this.isConfigured = false;
    }
  }

  /**
   * Ensures root folder 'MedDean_Documents' exists in Google Drive
   */
  async findOrCreateRootFolder() {
    if (!this.isConfigured || !this.driveClient) return "local-root-folder";

    if (this.rootFolderId) return this.rootFolderId;

    try {
      const res = await this.driveClient.files.list({
        q: "name = 'MedDean_Documents' and mimeType = 'application/vnd.google-apps.folder' and trashed = false",
        fields: "files(id, name)",
        spaces: "drive"
      });

      if (res.data.files && res.data.files.length > 0) {
        this.rootFolderId = res.data.files[0].id;
        return this.rootFolderId;
      }

      // Create root folder
      const folderMetadata = {
        name: "MedDean_Documents",
        mimeType: "application/vnd.google-apps.folder"
      };
      const created = await this.driveClient.files.create({
        resource: folderMetadata,
        fields: "id"
      });
      this.rootFolderId = created.data.id;
      return this.rootFolderId;
    } catch (err) {
      console.error("[Google Drive] findOrCreateRootFolder error:", err.message);
      return "local-root-folder";
    }
  }

  /**
   * Finds or creates a department folder inside root Drive folder
   */
  async findOrCreateDepartmentFolder(departmentName) {
    if (!this.isConfigured || !this.driveClient) return `local-${departmentName}-folder`;

    if (this.departmentFolderMap.has(departmentName)) {
      return this.departmentFolderMap.get(departmentName);
    }

    try {
      const rootId = await this.findOrCreateRootFolder();
      const q = `name = '${departmentName}' and '${rootId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
      
      const res = await this.driveClient.files.list({
        q,
        fields: "files(id, name)",
        spaces: "drive"
      });

      if (res.data.files && res.data.files.length > 0) {
        const folderId = res.data.files[0].id;
        this.departmentFolderMap.set(departmentName, folderId);
        return folderId;
      }

      // Create department folder
      const folderMetadata = {
        name: departmentName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [rootId]
      };
      const created = await this.driveClient.files.create({
        resource: folderMetadata,
        fields: "id"
      });
      const folderId = created.data.id;
      this.departmentFolderMap.set(departmentName, folderId);
      return folderId;
    } catch (err) {
      console.error(`[Google Drive] findOrCreateDepartmentFolder for ${departmentName} error:`, err.message);
      return `local-${departmentName}-folder`;
    }
  }

  /**
   * Uploads document file to department folder
   */
  async uploadDocument({ buffer, mimeType, filename, department, documentId }) {
    const targetDept = DEPARTMENTS.includes(department) ? department : "Administration";

    if (this.isConfigured && this.driveClient) {
      try {
        const parentFolderId = await this.findOrCreateDepartmentFolder(targetDept);
        const bufferStream = new stream.PassThrough();
        bufferStream.end(buffer);

        const fileMetadata = {
          name: filename,
          parents: [parentFolderId],
          description: `MedDean Document ${documentId} for ${targetDept}`
        };

        const media = {
          mimeType: mimeType || "application/octet-stream",
          body: bufferStream
        };

        const res = await this.driveClient.files.create({
          resource: fileMetadata,
          media: media,
          fields: "id, name, webViewLink, webContentLink"
        });

        // Make shareable / accessible for viewing
        try {
          await this.driveClient.permissions.create({
            fileId: res.data.id,
            requestBody: {
              role: "reader",
              type: "anyone"
            }
          });
        } catch (permErr) {
          // Ignore if domain restricted
        }

        return {
          driveFileId: res.data.id,
          driveFileLink: res.data.webViewLink || `https://drive.google.com/file/d/${res.data.id}/view`,
          webContentLink: res.data.webContentLink,
          filename: res.data.name,
          department: targetDept,
          isRemote: true
        };
      } catch (err) {
        console.warn("[Google Drive] Remote upload failed, saving to local drive storage:", err.message);
      }
    }

    // Local / Offline fallback storage
    const fileId = `gdrive_local_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const deptDir = path.join(this.localStorageDir, targetDept);
    if (!fs.existsSync(deptDir)) {
      fs.mkdirSync(deptDir, { recursive: true });
    }

    const localFilePath = path.join(deptDir, filename);
    fs.writeFileSync(localFilePath, buffer);

    const relativeLocalPath = path.relative(path.resolve(__dirname, ".."), localFilePath).replace(/\\/g, "/");
    const link = `/api/documents/preview/${fileId}`;

    // Record metadata
    const metadata = this.readMetadata();
    metadata[fileId] = {
      fileId,
      filename,
      mimeType,
      department: targetDept,
      documentId,
      localFilePath,
      uploadedAt: new Date().toISOString()
    };
    this.writeMetadata(metadata);

    return {
      driveFileId: fileId,
      driveFileLink: link,
      filename,
      department: targetDept,
      isRemote: false
    };
  }

  /**
   * Retrieves local file path and metadata by File ID for preview/download
   */
  getLocalFile(fileId) {
    const metadata = this.readMetadata();
    const entry = metadata[fileId];
    if (entry && fs.existsSync(entry.localFilePath)) {
      return entry;
    }
    return null;
  }

  readMetadata() {
    try {
      if (fs.existsSync(this.metadataFile)) {
        return JSON.parse(fs.readFileSync(this.metadataFile, "utf-8"));
      }
    } catch (e) {}
    return {};
  }

  writeMetadata(data) {
    try {
      fs.writeFileSync(this.metadataFile, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {}
  }
}

module.exports = new GoogleDriveService();
