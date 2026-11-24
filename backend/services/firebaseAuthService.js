/**
 * Firebase Authentication Management Service (Server-Side)
 * - Automatically provisions & synchronizes institutional accounts into Firebase Auth.
 * - Sets custom claims (role: 'admin' | 'section', sectionId, department, accountName).
 * - Verifies Firebase ID Tokens for incoming API requests.
 */

const { auth } = require("../config/firebase");

class FirebaseAuthService {
  constructor() {
    this.isSyncing = false;
  }

  /**
   * Verify an incoming Firebase ID token
   * @param {string} token - Firebase ID token from Authorization header
   * @returns {Promise<Object>} decoded token containing custom claims
   */
  async verifyIdToken(token) {
    if (!auth) {
      throw new Error("Firebase Admin Auth is not initialized.");
    }
    return await auth.verifyIdToken(token);
  }

  /**
   * Sync all institutional accounts into Firebase Auth with custom claims.
   * Runs on server startup or on-demand.
   * @param {Array} users - List of institutional users from users.json
   */
  async syncAllUsersToFirebase(users) {
    if (!auth) {
      console.warn("[FirebaseAuthService] Firebase Auth not available, skipping sync.");
      return;
    }

    if (this.isSyncing) {
      console.log("[FirebaseAuthService] Sync already in progress, skipping redundant call.");
      return;
    }

    this.isSyncing = true;
    console.log(`[FirebaseAuthService] Syncing ${users.length} institutional accounts to Firebase Auth...`);
    let createdCount = 0;
    let updatedCount = 0;
    let failedCount = 0;

    try {
      for (const u of users) {
        const email = `${u.username.toLowerCase()}@meddean.local`;
        const isAdmin = u.role === "admin";
        const defaultPassword = isAdmin ? "Admin@123" : "Dean@123";
        const displayName = u.profileName || u.accountName || u.name || u.department;

        const claims = {
          role: isAdmin ? "admin" : "section",
          sectionId: u.username.toLowerCase(),
          department: u.department,
          accountName: u.accountName || `${u.department} Dept`,
          category: u.category || (isAdmin ? "Dean" : "Section")
        };

        try {
          let firebaseUser = null;
          try {
            firebaseUser = await auth.getUserByEmail(email);
          } catch (err) {
            if (err.code !== "auth/user-not-found") {
              throw err;
            }
          }

          if (!firebaseUser) {
            try {
              firebaseUser = await auth.createUser({
                email,
                password: defaultPassword,
                displayName,
                emailVerified: true
              });
              createdCount++;
            } catch (createErr) {
              if (createErr.code === "auth/email-already-exists") {
                firebaseUser = await auth.getUserByEmail(email);
                updatedCount++;
              } else {
                throw createErr;
              }
            }
          } else {
            // Update display name if changed
            if (firebaseUser.displayName !== displayName) {
              await auth.updateUser(firebaseUser.uid, { displayName });
            }
            updatedCount++;
          }

          // Set Custom User Claims on Firebase Auth
          await auth.setCustomUserClaims(firebaseUser.uid, claims);
        } catch (err) {
          console.error(`[FirebaseAuthService] Error syncing account '${u.username}' (${email}):`, err.message);
          failedCount++;
        }
      }

      console.log(`[FirebaseAuthService] Sync complete: ${createdCount} created, ${updatedCount} verified/updated, ${failedCount} errors.`);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Update password in Firebase Auth for a specific username
   */
  async updateUserPassword(username, newPassword) {
    if (!auth) return;
    const email = `${username.toLowerCase()}@meddean.local`;
    try {
      const user = await auth.getUserByEmail(email);
      await auth.updateUser(user.uid, { password: newPassword });
      console.log(`[FirebaseAuthService] Successfully updated Firebase password for ${email}`);
    } catch (err) {
      console.error(`[FirebaseAuthService] Failed to update Firebase password for ${email}:`, err.message);
    }
  }

  /**
   * Update claims and metadata for a specific username
   */
  async updateUserClaimsAndDetails(username, details) {
    if (!auth) return;
    const email = `${username.toLowerCase()}@meddean.local`;
    try {
      const user = await auth.getUserByEmail(email);
      const updatePayload = {};
      if (details.profileName || details.accountName) {
        updatePayload.displayName = details.profileName || details.accountName;
      }
      if (Object.keys(updatePayload).length > 0) {
        await auth.updateUser(user.uid, updatePayload);
      }

      const claims = {
        role: details.role || (username === "admin" ? "admin" : "section"),
        sectionId: username.toLowerCase(),
        department: details.department,
        accountName: details.accountName,
        category: details.category
      };
      await auth.setCustomUserClaims(user.uid, claims);
      console.log(`[FirebaseAuthService] Updated claims for ${email}`);
    } catch (err) {
      console.error(`[FirebaseAuthService] Failed to update claims for ${email}:`, err.message);
    }
  }
}

module.exports = new FirebaseAuthService();
