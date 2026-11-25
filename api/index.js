/**
 * Vercel Serverless Function entry point for MedDean Document Tracker.
 * Mounts all Express /api/* routes including Firebase Auth verification,
 * Google Sheets live sync, Google Drive uploads, and institutional access control.
 */

const app = require("../backend/server");

module.exports = app;
