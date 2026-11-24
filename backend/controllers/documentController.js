/**
 * Document Controller for MedDean Document Tracker.
 * Coordinates OCR processing, human verification saving, Drive uploads, and Google Sheets sync.
 */

const axios = require("axios");
const FormData = require("form-data");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const googleDriveService = require("../services/googleDriveService");
const googleSheetsService = require("../services/googleSheetsService");
const { generateDocumentId, generateSafeFilename } = require("../utils/documentIdGenerator");
const { refineFields } = require("../utils/nodeOcrParser");
const { formatDateReadable, formatDateTimeReadable } = require("../utils/dateUtils");
const { DEPARTMENTS, INCOMING_SENDERS } = require("../config/departments");

const OCR_SERVICE_URL = process.env.OCR_SERVICE_URL || "http://127.0.0.1:8001";

// In-memory or temporary disk staging for uploaded files between OCR step and Save step
const stagedUploads = new Map();

class DocumentController {
  /**
   * Upload file and process OCR
   * POST /api/documents/process-ocr
   */
  async processOcr(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No document file provided for OCR."
        });
      }

      const stagingId = uuidv4();
      const originalname = req.file.originalname;
      const mimetype = req.file.mimetype;
      const buffer = req.file.buffer;

      // Save staged item
      stagedUploads.set(stagingId, {
        stagingId,
        buffer,
        originalname,
        mimetype,
        size: req.file.size,
        createdAt: Date.now()
      });

      // Clean up old staged files after 1 hour
      for (const [id, item] of stagedUploads.entries()) {
        if (Date.now() - item.createdAt > 3600000) {
          stagedUploads.delete(id);
        }
      }

      let rawText = "";
      let fields = { referenceNo: null, date: null, from: null, subject: null };

      // Call Python OCR Service
      try {
        const formData = new FormData();
        formData.append("file", buffer, {
          filename: originalname,
          contentType: mimetype
        });

        const ocrResponse = await axios.post(`${OCR_SERVICE_URL}/ocr`, formData, {
          headers: formData.getHeaders(),
          timeout: 45000
        });

        if (ocrResponse.data && ocrResponse.data.success) {
          rawText = ocrResponse.data.rawText || "";
          fields = ocrResponse.data.fields || fields;
        }
      } catch (ocrErr) {
        console.warn(`[DocumentController] Python OCR service call issue: ${ocrErr.message}`);
        // If Python OCR service is offline or image is not parsed, we gracefully extract from filename or return empty fields
        rawText = `[OCR Notice: OCR service reached with note: ${ocrErr.message}]`;
      }

      // Run Node.js heuristic refinement on rawText
      const refinedFields = refineFields(fields, rawText);

      // Create a base64 preview for the client
      const base64Preview = mimetype.startsWith("image/") 
        ? `data:${mimetype};base64,${buffer.toString("base64")}`
        : null;

      return res.status(200).json({
        success: true,
        stagingId,
        filename: originalname,
        mimetype,
        rawText,
        fields: refinedFields,
        previewData: base64Preview
      });
    } catch (err) {
      console.error("[DocumentController] OCR Process error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to process OCR on the document: " + err.message
      });
    }
  }

  /**
   * Save and Register verified document into Google Drive and Google Sheets
   * POST /api/documents
   */
  async saveAndRegister(req, res) {
    try {
      const {
        stagingId,
        referenceNo,
        communicationDate,
        deadlineDate,
        isUrgent,
        from,
        subject,
        department,
        remarks
      } = req.body;

      // 1. Validate required fields
      if (!department || !DEPARTMENTS.includes(department)) {
        return res.status(400).json({
          success: false,
          error: `Please select a valid department from the authorized list.`
        });
      }

      let fileBuffer = null;
      let filename = "document.pdf";
      let mimetype = "application/pdf";

      if (req.file) {
        fileBuffer = req.file.buffer;
        filename = req.file.originalname;
        mimetype = req.file.mimetype;
      } else if (stagingId && stagedUploads.has(stagingId)) {
        const staged = stagedUploads.get(stagingId);
        fileBuffer = staged.buffer;
        filename = staged.originalname;
        mimetype = staged.mimetype;
        stagedUploads.delete(stagingId);
      } else {
        return res.status(400).json({
          success: false,
          error: "Document file not found. Please upload the document again."
        });
      }

      // 2. Generate unique Document ID
      const allDocs = await googleSheetsService.getAllCommunications();
      const documentId = generateDocumentId(allDocs.length);

      // Generate safe filename for Drive
      const safeFilename = generateSafeFilename(documentId, referenceNo, filename);

      // 3. Upload to Google Drive (in department subfolder)
      const driveResult = await googleDriveService.uploadDocument({
        buffer: fileBuffer,
        mimeType: mimetype,
        filename: safeFilename,
        department,
        documentId
      });

      // 4. Append row to Google Sheets
      const newCommunication = await googleSheetsService.appendCommunication({
        documentId,
        referenceNo: (referenceNo || "").trim(),
        communicationDate: (communicationDate || formatDateReadable()).trim(),
        receivedDate: formatDateReadable(),
        deadlineDate: (deadlineDate || "").trim(),
        isUrgent: isUrgent === true || isUrgent === "true" || isUrgent === "YES",
        from: (from || "").trim(),
        subject: (subject || "").trim(),
        department,
        status: "Pending",
        remarks: (remarks || "").trim(),
        driveFileId: driveResult.driveFileId,
        driveFileLink: driveResult.driveFileLink,
        uploadedBy: (req.user && req.user.username) || "admin"
      });

      // 5. Return success confirmation
      return res.status(201).json({
        success: true,
        message: "Document registered successfully",
        document: newCommunication
      });
    } catch (err) {
      console.error("[DocumentController] Save & Register error:", err);
      return res.status(500).json({
        success: false,
        error: "Failed to save and register document: " + err.message
      });
    }
  }

  /**
   * Get all documents with server-side role/department filtering and query filters
   * GET /api/documents
   */
  async getAllDocuments(req, res) {
    try {
      const user = req.user;
      let allDocs = await googleSheetsService.getAllCommunications();

      // Enforce strict server-side role authorization
      if (user.role === "section" || user.role === "department") {
        const userDept = (user.department || "").toLowerCase();
        allDocs = allDocs.filter(d => (d.department || "").toLowerCase() === userDept);
      } else if (user.role === "admin" && req.query.department) {
        allDocs = allDocs.filter(d => (d.department || "").toLowerCase() === req.query.department.toLowerCase());
      }

      // Filter by status if requested
      if (req.query.status) {
        allDocs = allDocs.filter(d => d.status.toLowerCase() === req.query.status.toLowerCase());
      }

      // Filter by search query (Ref No, Subject, From, Document ID)
      if (req.query.search) {
        const q = req.query.search.toLowerCase().trim();
        allDocs = allDocs.filter(d =>
          (d.referenceNo && d.referenceNo.toLowerCase().includes(q)) ||
          (d.subject && d.subject.toLowerCase().includes(q)) ||
          (d.from && d.from.toLowerCase().includes(q)) ||
          (d.documentId && d.documentId.toLowerCase().includes(q))
        );
      }

      // Filter by date if requested
      if (req.query.date) {
        allDocs = allDocs.filter(d =>
          d.communicationDate.includes(req.query.date) ||
          d.receivedDate.includes(req.query.date)
        );
      }

      // Filter by urgent if requested
      if (req.query.urgent === "true") {
        allDocs = allDocs.filter(d => d.isUrgent === true);
      }

      return res.status(200).json({
        success: true,
        count: allDocs.length,
        documents: allDocs
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve documents: " + err.message
      });
    }
  }

  /**
   * Get pending documents
   * GET /api/documents/pending
   */
  async getPendingDocuments(req, res) {
    try {
      const user = req.user;
      let pendingDocs = [];

      if (user.role === "section" || user.role === "department") {
        pendingDocs = await googleSheetsService.getPendingCommunicationsByDepartment(user.department);
      } else {
        const targetDept = req.query.department;
        const all = await googleSheetsService.getAllCommunications();
        if (targetDept && targetDept.toLowerCase() !== "all") {
          pendingDocs = all.filter(d => d.department.toLowerCase() === targetDept.toLowerCase() && (d.status || "").toLowerCase() !== "closed");
        } else if (req.query.status && req.query.status.toLowerCase() !== "all") {
          pendingDocs = all.filter(d => (d.status || "").toLowerCase() === req.query.status.toLowerCase());
        } else {
          // All unclosed work (Pending, In Progress, Submitted for Closure)
          pendingDocs = all.filter(d => (d.status || "").toLowerCase() !== "closed");
        }
      }

      if (req.query.urgent === "true") {
        pendingDocs = pendingDocs.filter(d => d.isUrgent === true);
      }

      return res.status(200).json({
        success: true,
        count: pendingDocs.length,
        documents: pendingDocs
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve pending documents: " + err.message
      });
    }
  }

  /**
   * Get single document details by ID
   * GET /api/documents/:id
   */
  async getDocumentById(req, res) {
    try {
      const { id } = req.params;
      const doc = await googleSheetsService.findCommunicationByDocumentId(id);

      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Document with ID ${id} not found.`
        });
      }

      // Enforce department / section authorization
      if ((req.user.role === "section" || req.user.role === "department") && doc.department.toLowerCase() !== req.user.department.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized: You do not have permission to view documents from other departments."
        });
      }

      return res.status(200).json({
        success: true,
        document: doc
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch document: " + err.message
      });
    }
  }

  /**
   * Update document status and remarks
   * PUT /api/documents/:id/status
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks, deadlineDate, isUrgent } = req.body;

      const doc = await googleSheetsService.findCommunicationByDocumentId(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Document with ID ${id} not found.`
        });
      }

      // Department / section authorization check
      if ((req.user.role === "section" || req.user.role === "department") && doc.department.toLowerCase() !== req.user.department.toLowerCase()) {
        return res.status(403).json({
          success: false,
          error: "Unauthorized: You do not have permission to update documents of other departments."
        });
      }

      // STRICT ROLE RULE: Only Dean / Admin can officially close a document
      if (status === "Closed" && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Access Denied: Only the Dean / Admin has the authority to officially close communications. Please use 'Submitted for Closure' to submit your resolution for Dean approval."
        });
      }

      const validStatuses = ["Pending", "In Progress", "Submitted for Closure", "Closed"];
      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Must be one of: ${validStatuses.join(", ")}`
        });
      }

      // If submitting for closure or closing, require action taken / remarks
      if ((status === "Closed" || status === "Submitted for Closure") && (!remarks || !remarks.trim()) && (!doc.remarks || !doc.remarks.trim())) {
        return res.status(400).json({
          success: false,
          error: "Action taken / remarks are required when submitting for closure or closing a communication."
        });
      }

      const updates = {};
      if (status) updates.status = status;
      if (remarks !== undefined) updates.remarks = remarks.trim();
      if (deadlineDate !== undefined) updates.deadlineDate = deadlineDate.trim();
      if (isUrgent !== undefined) updates.isUrgent = isUrgent === true || isUrgent === "true" || isUrgent === "YES";

      const updated = await googleSheetsService.updateCommunication(id, updates);

      return res.status(200).json({
        success: true,
        message: status === "Submitted for Closure" 
          ? "Work submitted to Dean's Office for closure review." 
          : "Document status updated successfully.",
        document: updated
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to update document: " + err.message
      });
    }
  }

  /**
   * Update document metadata
   * PUT /api/documents/:id
   */
  async updateDocument(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const doc = await googleSheetsService.findCommunicationByDocumentId(id);
      if (!doc) {
        return res.status(404).json({
          success: false,
          error: `Document with ID ${id} not found.`
        });
      }

      // Only admin can update general metadata
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          error: "Only administrators can edit document registration details."
        });
      }

      const updated = await googleSheetsService.updateCommunication(id, updates);

      return res.status(200).json({
        success: true,
        message: "Document updated successfully.",
        document: updated
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to update document: " + err.message
      });
    }
  }

  /**
   * Preview original document by drive file ID
   * GET /api/documents/preview/:fileId
   */
  async previewFile(req, res) {
    try {
      const { fileId } = req.params;
      const fileInfo = googleDriveService.getLocalFile(fileId);

      if (!fileInfo) {
        return res.status(404).send("Document file not found or still syncing with Google Drive.");
      }

      res.setHeader("Content-Type", fileInfo.mimeType || "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${fileInfo.filename}"`);
      const fileStream = fs.createReadStream(fileInfo.localFilePath);
      return fileStream.pipe(res);
    } catch (err) {
      return res.status(500).send("Error loading file: " + err.message);
    }
  }

  /**
   * Download original document
   * GET /api/documents/download/:fileId
   */
  async downloadFile(req, res) {
    try {
      const { fileId } = req.params;
      const fileInfo = googleDriveService.getLocalFile(fileId);

      if (!fileInfo) {
        return res.status(404).send("Document file not found.");
      }

      res.setHeader("Content-Type", fileInfo.mimeType || "application/octet-stream");
      res.setHeader("Content-Disposition", `attachment; filename="${fileInfo.filename}"`);
      const fileStream = fs.createReadStream(fileInfo.localFilePath);
      return fileStream.pipe(res);
    } catch (err) {
      return res.status(500).send("Error downloading file: " + err.message);
    }
  }

  /**
   * Get known unique senders list for autocomplete
   * GET /api/documents/senders
   */
  async getKnownSenders(req, res) {
    try {
      return res.status(200).json({
        success: true,
        senders: INCOMING_SENDERS
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to fetch senders list: " + err.message
      });
    }
  }
}

module.exports = new DocumentController();
