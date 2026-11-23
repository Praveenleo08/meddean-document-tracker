/**
 * Document Routes for MedDean Document Tracker.
 */

const express = require("express");
const multer = require("multer");
const router = express.Router();
const documentController = require("../controllers/documentController");
const { authenticateToken, requireAdmin } = require("../middleware/authMiddleware");

// Configure Multer memory storage and file type validation
const storage = multer.memoryStorage();
const fileFilter = (req, file, cb) => {
  const allowedMimes = ["image/jpeg", "image/jpg", "image/png", "application/pdf"];
  if (allowedMimes.includes(file.mimetype.toLowerCase())) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type. Please upload a PDF, JPG, JPEG, or PNG document."), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 25 * 1024 * 1024 // 25MB limit
  },
  fileFilter
});

// Document Preview & Download (publicly accessible with fileId token or authenticated)
router.get("/preview/:fileId", (req, res) => documentController.previewFile(req, res));
router.get("/download/:fileId", (req, res) => documentController.downloadFile(req, res));

// Authenticated Routes
router.use(authenticateToken);

// Senders list for autocomplete
router.get("/senders", (req, res) => documentController.getKnownSenders(req, res));

// OCR processing (Admin only)
router.post("/process-ocr", requireAdmin, upload.single("file"), (req, res) =>
  documentController.processOcr(req, res)
);

// Save and register document (Admin only)
router.post("/", requireAdmin, upload.single("file"), (req, res) =>
  documentController.saveAndRegister(req, res)
);

// Get pending communications (Role-filtered: Dept sees only its own, Admin sees all/filtered)
router.get("/pending", (req, res) => documentController.getPendingDocuments(req, res));

// Get all communications (Role-filtered)
router.get("/", (req, res) => documentController.getAllDocuments(req, res));

// Get single communication details
router.get("/:id", (req, res) => documentController.getDocumentById(req, res));

// Update communication status & remarks (Department or Admin)
router.put("/:id/status", (req, res) => documentController.updateStatus(req, res));

// Update document details (Admin only)
router.put("/:id", requireAdmin, (req, res) => documentController.updateDocument(req, res));

module.exports = router;
