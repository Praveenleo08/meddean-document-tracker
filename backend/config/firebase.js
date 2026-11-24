/**
 * Firebase Admin SDK Configuration
 * Strictly Server-Side Only: Never expose service account or private keys to the frontend.
 */

const admin = require("firebase-admin");
const { getAuth } = require("firebase-admin/auth");
const path = require("path");
const fs = require("fs");

let firebaseApp = null;
let firebaseAuth = null;

function initFirebase() {
  if (firebaseApp) {
    return { app: firebaseApp, auth: firebaseAuth };
  }

  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || path.resolve(__dirname, "firebase-service-account.json");

  try {
    if (fs.existsSync(keyPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
      firebaseApp = admin.initializeApp({
        credential: admin.cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID || "meddean-tracker"
      });
      firebaseAuth = getAuth(firebaseApp);
      console.log(`[FirebaseAdmin] Initialized successfully for project: ${serviceAccount.project_id} (${serviceAccount.client_email})`);
    } else if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      firebaseApp = admin.initializeApp({
        credential: admin.cert({
          projectId: process.env.FIREBASE_PROJECT_ID || "meddean-tracker",
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
        })
      });
      firebaseAuth = getAuth(firebaseApp);
      console.log("[FirebaseAdmin] Initialized successfully from environment variables.");
    } else {
      console.warn(`[FirebaseAdmin] Warning: Service account file not found at ${keyPath}`);
    }
  } catch (err) {
    console.error("[FirebaseAdmin] Initialization failed:", err.message);
  }

  return { app: firebaseApp, auth: firebaseAuth };
}

const { app, auth } = initFirebase();

module.exports = {
  admin,
  app,
  auth
};
