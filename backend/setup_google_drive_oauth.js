/**
 * Google Drive OAuth 2.0 Quick Setup Helper
 * Run: node setup_google_drive_oauth.js
 *
 * Obtains a Refresh Token for your personal Google Drive (15 GB quota)
 * and automatically saves it to your backend/.env file.
 */

require("dotenv").config();
const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");
const { google } = require("googleapis");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Google Drive OAuth 2.0 Setup Helper");
  console.log("==============================================================================");

  let clientId = process.env.GOOGLE_CLIENT_ID;
  let clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || clientId.includes("your-client-id")) {
    console.log("Please obtain an OAuth 2.0 Client ID from Google Cloud Console:");
    console.log("1. Go to: https://console.cloud.google.com/apis/credentials?project=meddean-office");
    console.log("2. Click '+ CREATE CREDENTIALS' -> 'OAuth client ID'");
    console.log("3. Application type: 'Web application'");
    console.log("4. Name: 'MedDean Drive Uploader'");
    console.log("5. Authorized redirect URIs: Add 'http://localhost:8999/oauth2callback'");
    console.log("6. Click 'CREATE' and copy your Client ID and Client Secret.\n");

    clientId = (await question("Enter your OAuth Client ID: ")).trim();
    clientSecret = (await question("Enter your OAuth Client Secret: ")).trim();
  } else {
    console.log(`[✓] Detected Client ID: ${clientId}`);
  }

  if (!clientId || !clientSecret) {
    console.log("[X] Client ID and Secret are required to proceed.");
    rl.close();
    return;
  }

  const redirectUri = "http://localhost:8999/oauth2callback";
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/drive"],
    prompt: "consent"
  });

  console.log("\n------------------------------------------------------------------------------");
  console.log("👉 Please open this URL in your web browser to authorize Google Drive access:\n");
  console.log(authUrl);
  console.log("\n------------------------------------------------------------------------------");
  console.log("Waiting for authorization... (Your browser should open automatically)");
  console.log("(If redirected to an empty page or localhost error, you can also paste the URL here)");

  let server;
  let finished = false;

  async function handleCode(code) {
    if (finished) return;
    finished = true;
    try {
      const { tokens } = await oauth2Client.getToken(code);
      const refreshToken = tokens.refresh_token;

      if (refreshToken) {
        console.log("\n✓ Refresh token acquired successfully!");
        updateEnvFile({
          GOOGLE_CLIENT_ID: clientId,
          GOOGLE_CLIENT_SECRET: clientSecret,
          GOOGLE_REFRESH_TOKEN: refreshToken
        });
        console.log("\n==============================================================================");
        console.log(">>> SUCCESS: Updated backend/.env with Google Drive OAuth credentials! <<<");
        console.log("You can now run: node test_google_drive_sync.js to verify Drive uploads!");
        console.log("==============================================================================\n");
      } else {
        console.log("\n[!] Note: Google returned an access token but no refresh token.");
        console.log("    This happens if you already granted permissions earlier.");
        console.log("    To force a refresh token, revoke access at: https://myaccount.google.com/permissions");
        console.log("    Then run this script again.");
      }
    } catch (e) {
      console.error("\n[X] Error exchanging code for tokens:", e.message);
    } finally {
      if (server) server.close();
      rl.close();
      process.exit(0);
    }
  }

  // Spin up temporary local HTTP server to receive the authorization code
  server = http.createServer(async (req, res) => {
    try {
      if (req.url.startsWith("/oauth2callback")) {
        const query = url.parse(req.url, true).query;
        if (query.code) {
          res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
          res.end(`
            <html>
              <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h2 style="color: #10B981;">Authentication Successful!</h2>
                <p>Google Drive is now connected to MedDean Document Tracker.</p>
                <p>You can close this tab and return to your terminal.</p>
              </body>
            </html>
          `);
          await handleCode(query.code);
        } else if (query.error) {
          res.writeHead(400, { "Content-Type": "text/plain" });
          res.end("Authentication error: " + query.error);
          console.error("\n[X] OAuth error:", query.error);
          server.close();
          rl.close();
        }
      }
    } catch (e) {
      server.close();
      rl.close();
    }
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.log("\n[!] Port 8999 is in use. After approving in your browser, copy the redirected URL from your address bar and paste it below.");
    } else {
      console.error("[X] Server error:", err.message);
    }
  });

  server.listen(8999, () => {
    // Open clean URL in default browser using PowerShell without shell character corruption
    try {
      execFile("powershell", ["-NoProfile", "-Command", `Start-Process '${authUrl}'`]);
    } catch (e) {}
  });

  // Prompt fallback in case browser redirect cannot connect to port 8999
  const manualInput = await question("\nPaste the redirect URL or authorization code here (optional): ");
  if (manualInput && manualInput.trim() && !finished) {
    let code = manualInput.trim();
    if (code.includes("code=")) {
      try {
        const parsed = url.parse(code, true);
        code = parsed.query.code || code;
      } catch (e) {}
    }
    await handleCode(code);
  }
}

function updateEnvFile(keyValuePairs) {
  const envPath = path.resolve(__dirname, ".env");
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf-8");
  }

  for (const [key, value] of Object.entries(keyValuePairs)) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    if (regex.test(content)) {
      content = content.replace(regex, `${key}=${value}`);
    } else {
      content += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, content.trim() + "\n", "utf-8");
}

main().catch(err => {
  console.error("Setup error:", err);
  rl.close();
});
