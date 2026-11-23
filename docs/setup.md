# MedDean Document Tracker - Setup & Google Integration Guide

This guide walks you through setting up Google Cloud Platform (GCP) credentials for Google Drive and Google Sheets integration, configuring environment variables, and launching the services.

---

## 1. Out-of-the-Box Development Mode (Zero Configuration)

MedDean Document Tracker includes an **automatic local simulation adapter**:
- If Google credentials are not yet configured in `.env`, the system automatically activates the **Local Storage & Sheets Register mode**.
- Documents are saved locally under `backend/meddean-drive-storage/<Department>/`.
- Records are saved with exact Google Sheet schemas in `backend/data/googleSheetsRegister.json`.
- Complete testing, upload, OCR, verification, and status updates work immediately without needing GCP credentials!

---

## 2. Google Cloud Platform Setup (Production / Live Sync)

To connect live Google Drive and Google Sheets:

### Step 1: Create a Google Cloud Project
1. Navigate to [Google Cloud Console](https://console.cloud.google.com/).
2. Click **Select a Project** > **New Project**.
3. Name your project (e.g., `MedDean-Office-Tracker`) and click **Create**.

### Step 2: Enable Required APIs
1. In the GCP search bar, search for **Google Drive API** and click **Enable**.
2. Search for **Google Sheets API** and click **Enable**.

### Step 3: Choose Authentication Method

#### Option A: Service Account (Recommended for Server Applications)
1. Go to **IAM & Admin** > **Service Accounts**.
2. Click **Create Service Account**, name it `meddean-bot`, and grant the **Editor** role.
3. Click on the newly created service account > **Keys** tab > **Add Key** > **Create new key** (JSON).
4. Download the JSON key file and place it in `backend/config/google-service-account.json`.
5. In your `.env` file, specify:
   ```env
   GOOGLE_SERVICE_ACCOUNT_KEY_PATH=./config/google-service-account.json
   ```

#### Option B: OAuth 2.0 Client ID
1. Go to **APIs & Services** > **OAuth consent screen**.
2. Select **External** (or **Internal** if within a Google Workspace domain).
3. Fill in the App Name: `MedDean Document Tracker` and your support email.
4. Add scopes: `https://www.googleapis.com/auth/drive` and `https://www.googleapis.com/auth/spreadsheets`.
5. Go to **Credentials** > **Create Credentials** > **OAuth client ID**.
6. Select Application type: **Web application**.
7. Under **Authorized redirect URIs**, add:
   `http://localhost:5000/api/auth/google/callback`
8. Copy the **Client ID** and **Client Secret** into your `.env` file.

---

## 3. Google Drive Setup
1. Open [Google Drive](https://drive.google.com/).
2. Create a new folder named `MedDean_Documents`.
3. Open the folder and copy the ID from the URL:
   `https://drive.google.com/drive/folders/1A2B3C4D5E...`
4. If using a Service Account, share this folder with your service account's client email with **Editor** permissions.
5. In `.env`:
   ```env
   GOOGLE_DRIVE_ROOT_FOLDER_ID=1A2B3C4D5E...
   ```

---

## 4. Google Sheets Setup
1. Open [Google Sheets](https://sheets.google.com/).
2. Create a new spreadsheet named `MedDean_Communication_Register`.
3. Rename the first sheet tab from `Sheet1` to:
   **`Communication Register`**
4. Paste these 14 headers in Row 1 (Columns A to N):
   ```
   A1: Document ID
   B1: Reference No
   C1: Communication Date
   D1: Received Date
   E1: From
   F1: Subject
   G1: Department
   H1: Status
   I1: Remarks
   J1: Drive File ID
   K1: Drive File Link
   L1: Uploaded By
   M1: Last Updated
   N1: Closed Date
   ```
5. Copy the Spreadsheet ID from the URL:
   `https://docs.google.com/spreadsheets/d/1X2Y3Z.../edit`
6. If using a Service Account, share the sheet with your service account's client email with **Editor** permissions.
7. In `.env`:
   ```env
   GOOGLE_SHEET_ID=1X2Y3Z...
   ```

---

## 5. Running the Application Locally

### 1. Start Python OCR Service (Port 8001)
```powershell
cd ocr-service
# Using installed Python 3.11
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

### 2. Start Express Backend (Port 5000)
```powershell
cd backend
npm install
npm run dev
# or: node server.js
```

### 3. Start Vite React Frontend (Port 5173)
```powershell
cd frontend
npm install
npm run dev
```

Open your browser at `http://localhost:5173`.
