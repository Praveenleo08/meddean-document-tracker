# MedDean Document Tracker
> **Intelligent Administrative Communication & Pending Work Management System for a Medical College Dean's Office**

---

## 1. Project Overview

The Dean’s office of a Medical College receives high volumes of critical official correspondence every week—letters from the National Medical Commission, Ministry of Health, university examination authorities, state government directives, court notices, inter-departmental requisitions, and vendor tenders.

**MedDean Document Tracker** solves the communication bottlenecks by replacing fragile paper registers and siloed email threads with a full-stack, automated tracking system:
1. **Administrative Staff / Dean Office** uploads or scans correspondence (PDF, JPG, PNG) using direct upload or the integrated camera.
2. **FastAPI OCR Engine** preprocesses the scan and extracts crucial metadata:
   - **Reference Number**
   - **Date**
   - **From / Sender**
   - **Subject**
3. **Mandatory Human Verification**: Staff can review, modify, or correct OCR data side-by-side with the scanned document before registering.
4. **Cloud Synchronization**:
   - The original file is stored in **Google Drive** under the specific department’s subfolder inside `MedDean_Documents`.
   - Exactly **one row** is appended to the central live **Google Sheet** (`MedDean_Communication_Register`), marked initially as `Status = Pending`.
5. **Strict Department Isolation**: Department users (e.g., Pharmacy, Administration, Finance) log in and can **ONLY view their department's pending communications**.
6. **Workflow & Status Updates**: Department officers open the original letter, mark work `In Progress`, add action remarks, and seal the work as `Closed`. Updates **modify the existing row in Google Sheets in-place**—guaranteeing zero duplicate rows!

> **Compliance Note**: This is an administrative correspondence tracking system. No patient medical records (EMR/EHR) or patient clinical data are stored or processed.

---

## 2. Key Features

- **Multi-Engine OCR Pipeline**: Grayscale conversion, adaptive thresholding, bilateral noise filtering, and deskewing via OpenCV & Pillow. Uses EasyOCR & Tesseract with pluggable PaddleOCR architecture. Direct PDF text stream and image rendering via `pypdfium2`.
- **Integrated Camera Capture**: Direct in-browser camera viewfinder with document alignment guides, live retake controls, and native mobile camera support (`capture="environment"`).
- **Human-in-the-Loop Quality Control**: Split-screen desktop layout displaying the original scanned document side-by-side with editable extracted fields. Double-click prevention protects against duplicate submissions.
- **Google Drive Storage Hierarchy**: Auto-creates root `MedDean_Documents` folder and departmental subfolders with safe, predictable administrative filenames (`DOC-2026-00001_PH-2026-105.pdf`).
- **Google Sheets Live Central Register**: 14-column canonical schema. Enforces strict **single-row-per-document consistency**; updates modify the existing row identified by `Document ID`.
- **Role-Based Access Control (RBAC)**: Admin and Department roles with server-side authorization. Department users cannot access or view records of other departments.
- **Executive Dean & Department Dashboards**: Real-time KPI summary cards (`Total`, `Pending`, `In Progress`, `Closed`), department workloads, and multi-criteria filters (Search, Department, Status, Date).
- **Out-of-the-Box Local Mode**: Runs locally with built-in Google Drive & Sheets simulation fallback even before GCP credentials are configured.

---

## 3. Technology Stack

### Frontend
- **React.js 19** with **Vite**
- **React Router 7** for role-protected client-side navigation
- **Axios** with JWT request/response interceptors
- **Lucide React** for institutional medical/administrative iconography
- **CSS3 Design System** tailored for institutional administrative portals

### Backend
- **Node.js** & **Express.js**
- **Multer** for multipart memory-buffered document uploads (up to 25MB)
- **Google APIs Client Library (`googleapis`)** for Drive v3 & Sheets v4
- **JWT (JSON Web Tokens)** for stateless authentication
- **bcryptjs** for secure password hashing
- **uuid** for unique transaction and session tracking

### OCR Microservice
- **Python 3.11**
- **FastAPI** & **Uvicorn**
- **OpenCV (`opencv-python-headless`)** for noise reduction, Otsu binarization, and deskewing
- **Pillow (PIL)** for image manipulation
- **pypdfium2** for PDF rendering and direct text layer extraction
- **EasyOCR / pytesseract** for neural character recognition

---

## 4. Project Structure

```
meddean-document-tracker/
├── backend/
│   ├── config/
│   │   └── departments.js           # Central configurable department registry
│   ├── controllers/
│   │   ├── authController.js        # Authentication & session endpoints
│   │   ├── dashboardController.js   # KPI aggregation & department summaries
│   │   └── documentController.js    # OCR coordinator, Drive upload, Sheets sync
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification & department isolation
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── dashboardRoutes.js
│   │   └── documentRoutes.js
│   ├── services/
│   │   ├── authService.js           # User management & bcrypt verification
│   │   ├── googleDriveService.js    # Drive folders, file uploads & local storage
│   │   └── googleSheetsService.js   # Sheets central register & row updater
│   ├── utils/
│   │   ├── dateUtils.js             # DD-MM-YYYY formatters
│   │   ├── documentIdGenerator.js   # DOC-YYYY-NNNNN sequential generator
│   │   └── nodeOcrParser.js         # Node heuristic extraction & refinement
│   ├── data/
│   │   └── googleSheetsRegister.json# Local mirror register for offline/demo mode
│   ├── meddean-drive-storage/       # Local drive storage directory
│   ├── server.js                    # Express app entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CameraCapture.jsx    # Browser camera capture & viewfinder
│   │   │   ├── DocumentModal.jsx    # Document view & workflow status updater
│   │   │   ├── Navbar.jsx           # Institutional header & profile
│   │   │   ├── Sidebar.jsx          # Role-based navigation
│   │   │   └── StatusBadge.jsx      # Pending/In Progress/Closed visual pills
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication state & JWT storage
│   │   ├── pages/
│   │   │   ├── AdminDashboardPage.jsx
│   │   │   ├── AllCommunicationsPage.jsx
│   │   │   ├── DepartmentDashboardPage.jsx
│   │   │   ├── DepartmentsPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── PendingWorksPage.jsx
│   │   │   └── UploadPage.jsx
│   │   ├── services/
│   │   │   └── api.js               # Axios instance with interceptors
│   │   ├── App.jsx                  # Protected layout & routing table
│   │   ├── index.css                # Medical institutional design system
│   │   └── main.jsx
│   ├── vite.config.js
│   └── package.json
│
├── ocr-service/
│   ├── app.py                       # FastAPI server (/ocr, /health)
│   ├── ocr.py                       # Modular OCR wrapper (EasyOCR / Tesseract)
│   ├── preprocessing.py             # Grayscale, denoise, Otsu threshold, deskew
│   ├── field_extractor.py           # Robust regex & heuristic parsers
│   └── requirements.txt
│
├── docs/
│   ├── architecture.md              # Detailed architecture & sequence diagrams
│   └── setup.md                     # GCP, Drive & Sheets setup walkthrough
│
├── .env.example                     # Environment configuration template
├── .gitignore
└── README.md
```

---

## 5. Demo Accounts

For immediate local testing, the following accounts are pre-configured:

| Role | Username | Password | Department / Scope |
|---|---|---|---|
| **Dean Office Admin** | `admin` | `Admin@123` | Full Access (All Departments) |
| **Pharmacy Officer** | `pharmacy` | `Pharmacy@123` | Pharmacy Department |
| **Administration Officer** | `administration` | `AdminDept@123` | Administration Department |
| **Finance Officer** | `finance` | `Finance@123` | Finance Department |
| **HR Superintendent** | `hr` | `HR@123` | Human Resources Department |
| **Nursing Superintendent** | `nursing` | `Nursing@123` | Nursing Department |

*Tip: The Login Page includes a **1-Click Demo Fill panel** for instant login during testing.*

---

## 6. Installation & Execution

### Prerequisites
- Node.js (v18+)
- Python 3.11+

### Step 1: Install Dependencies
```powershell
# In root:
# 1. OCR Service dependencies
cd ocr-service
pip install -r requirements.txt

# 2. Backend dependencies
cd ../backend
npm install

# 3. Frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Environment
Copy `.env.example` to `backend/.env`:
```powershell
copy .env.example backend\.env
```
*(If testing offline, leave the Google Cloud variables blank—the app will run in local simulation mode automatically!)*

### Step 3: Run the Services

Open three terminal windows:

**Terminal 1 — OCR Microservice (Port 8001):**
```powershell
cd ocr-service
python -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload
```

**Terminal 2 — Node.js Backend API (Port 5000):**
```powershell
cd backend
node server.js
```

**Terminal 3 — React Frontend (Port 5173):**
```powershell
cd frontend
npm run dev
```

Visit **`http://localhost:5173`** in your browser.

---

## 7. Primary Demonstration Scenario

Follow this walkthrough to verify the complete end-to-end lifecycle:

1. **Admin Login**:
   - Go to `http://localhost:5173`.
   - Click the `admin` demo button and sign in.
   - You arrive at the **Executive Dean Dashboard** displaying KPI cards and the department summary table.

2. **Upload & Process Document**:
   - Click **Upload Document** in the navigation.
   - Drop a PDF or image file (or click **Capture with Camera**).
   - Select **Pharmacy** from the department dropdown.
   - Click **Process OCR & Verify**.

3. **Human Verification**:
   - The side-by-side verification screen displays the original scanned document on the left and the extracted fields on the right.
   - Verify or modify:
     - Reference Number: `PH/2026/105`
     - Communication Date: `29-09-2026`
     - From: `Dean Office`
     - Subject: `Hospital Pharmacy Drug Formulary & Inventory Audit`
   - Click **Save & Register**.

4. **Confirmation**:
   - The success banner confirms the new Document ID (e.g. `DOC-2026-00006`), initial status `Pending`, and the Google Drive document link.
   - The document is added to the Google Sheet register.

5. **Department Officer Login (Strict Isolation)**:
   - Click **Sign Out**.
   - Log in as `pharmacy` / `Pharmacy@123`.
   - Notice: The header shows **Pharmacy Department**. The dashboard displays **ONLY Pharmacy documents**. Communications belonging to Administration, Finance, or HR are strictly inaccessible.

6. **Action & Status Transition**:
   - In **Pending Works**, find `DOC-2026-00006`.
   - Click **View & Update**.
   - Review the document preview.
   - Click **Mark In Progress** — status updates in real-time.
   - Add Remarks: `"Pharmacy audit committee formed. Physical stock count scheduled."`
   - Click **Close Work**.
   - Status changes to **Closed**, with `Closed Date` recorded.

7. **Verify Single-Row Consistency**:
   - Refresh the page: the document is removed from **Pending Works** and cataloged under **All My Department Communications**.
   - In the Google Sheet register, **only the existing row was updated**; no duplicate rows were created.

---

## 8. Common Troubleshooting

| Issue | Cause | Resolution |
|---|---|---|
| `Unable to connect to OCR service` | Python service not running on port 8001 | Start `uvicorn app:app --port 8001` in `ocr-service/`. |
| `Unsupported file type` | Uploaded non-PDF/Image file | Ensure file has `.pdf`, `.jpg`, `.jpeg`, or `.png` extension. |
| `Camera permission denied` | Browser blocked webcam | Allow camera in browser settings or use the file camera capture button. |
| `Google Sheets API 403` | Service account lacks sheet access | Share the spreadsheet with the service account client email as **Editor**. |
| `Cannot load npm.ps1 on Windows` | Execution policy restricted | Run `npm.cmd` instead of `npm`. |

---

## 9. License & Institutional Use

Developed for institutional deployment in Medical College Administrative Offices and Dean's Directorates. Free for academic and administrative customization.
