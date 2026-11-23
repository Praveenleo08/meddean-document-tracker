/**
 * Generates unique, predictable Document IDs.
 * Format: DOC-YYYY-NNNNN (e.g. DOC-2026-00001)
 */

function generateDocumentId(existingCount = 0) {
  const currentYear = new Date().getFullYear();
  const nextSeq = existingCount + 1;
  const seqPadded = String(nextSeq).padStart(5, "0");
  return `DOC-${currentYear}-${seqPadded}`;
}

function generateSafeFilename(documentId, referenceNo, originalFilename) {
  const safeDocId = (documentId || "DOC").replace(/[^a-zA-Z0-9_-]/g, "_");
  const safeRef = (referenceNo || "REF").replace(/[^a-zA-Z0-9_-]/g, "_");
  const ext = originalFilename ? originalFilename.split(".").pop() : "pdf";
  return `${safeDocId}_${safeRef}.${ext}`;
}

module.exports = {
  generateDocumentId,
  generateSafeFilename
};
