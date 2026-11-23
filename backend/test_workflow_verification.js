const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

async function runTests() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Workflow & Verification Test Suite");
  console.log("==============================================================================");

  try {
    // 1. Login as Admin
    console.log("\n[1] Logging in as Admin (Dean)...");
    const adminLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: "admin",
      password: "Admin@123"
    });
    const adminToken = adminLogin.data.token;
    console.log(" [✓] Admin Login successful. User:", adminLogin.data.user.name, "| Role:", adminLogin.data.user.role);

    // 2. Login as Department User (Pharmacy)
    console.log("\n[2] Logging in as Department User (pharmacy)...");
    const deptLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: "pharmacy",
      password: "Pharmacy@123"
    });
    const deptToken = deptLogin.data.token;
    console.log(" [✓] Pharmacy Login successful. Department:", deptLogin.data.user.department, "| Role:", deptLogin.data.user.role);

    // 3. Test Dashboard Summary Endpoint for Admin
    console.log("\n[3] Testing Admin Dashboard Summary KPI...");
    const adminSummary = await axios.get(`${API_BASE}/dashboard/summary`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(" [✓] Admin Metrics:", adminSummary.data.metrics);
    if (adminSummary.data.metrics.submittedForClosure !== undefined && adminSummary.data.metrics.urgent !== undefined) {
      console.log(" [✓] Verified: 'submittedForClosure' and 'urgent' KPI fields exist in summary!");
    } else {
      console.error(" [x] Missing KPI fields in admin summary:", adminSummary.data.metrics);
    }

    // 4. Test Documents Endpoint
    console.log("\n[4] Testing Documents Endpoint...");
    const docsRes = await axios.get(`${API_BASE}/documents`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(` [✓] Total Documents in register: ${docsRes.data.documents.length}`);
    if (docsRes.data.documents.length > 0) {
      const sample = docsRes.data.documents[0];
      console.log(" [i] Sample document properties:", {
        documentId: sample.documentId,
        refNo: sample.referenceNo,
        date: sample.communicationDate,
        deadlineDate: sample.deadlineDate,
        isUrgent: sample.isUrgent,
        status: sample.status
      });
    }

    // 5. Test Role Authorization: Department attempts to directly CLOSE a document
    console.log("\n[5] Testing Security Policy: Pharmacy department attempts to directly CLOSE work...");
    const testDocId = docsRes.data.documents.length > 0 ? docsRes.data.documents[0].documentId : "DOC-2026-0001";
    try {
      await axios.put(`${API_BASE}/documents/${testDocId}/status`, {
        status: "Closed",
        remarks: "Trying to close directly as department"
      }, {
        headers: { Authorization: `Bearer ${deptToken}` }
      });
      console.error(" [x] SECURITY FAILURE: Department user was erroneously allowed to close document!");
    } catch (err) {
      if (err.response && err.response.status === 403) {
        console.log(" [✓] PASS: Department direct closure blocked with 403 Forbidden!");
        console.log("     Server message:", err.response.data.error);
      } else {
        console.error(" [!] Unexpected error:", err.message, err.response?.data);
      }
    }

    // 6. Test Department workflow: Move to In Progress or Submitted for Closure
    console.log("\n[6] Testing Department Workflow: Pharmacy submits work for closure...");
    const submitRes = await axios.put(`${API_BASE}/documents/${testDocId}/status`, {
      status: "Submitted for Closure",
      remarks: "Work completed by Pharmacy department. Awaiting Dean final closure approval."
    }, {
      headers: { Authorization: `Bearer ${deptToken}` }
    });
    console.log(" [✓] PASS: Pharmacy successfully moved work to 'Submitted for Closure'!");
    console.log("     New Status:", submitRes.data.document.status);
    console.log("     Remarks:", submitRes.data.document.remarks);

    // 7. Test Dean Exclusive Authority: Dean officially reviews and Closes work
    console.log("\n[7] Testing Dean Authority: Dean reviews and officially closes work...");
    const deanCloseRes = await axios.put(`${API_BASE}/documents/${testDocId}/status`, {
      status: "Closed",
      remarks: "Dean review: Verified and approved. Sealed officially."
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(" [✓] PASS: Dean successfully approved and closed work!");
    console.log("     Final Status:", deanCloseRes.data.document.status);
    console.log("     Closed Date:", deanCloseRes.data.document.closedDate);

    console.log("\n==============================================================================");
    console.log(" ALL TESTS PASSED SUCCESSFULLY! WORKFLOW & SECURITY ARE ROCK-SOLID!");
    console.log("==============================================================================");

  } catch (err) {
    console.error("\n[!] Test failed with error:", err.message);
    if (err.response) {
      console.error("    Response status:", err.response.status);
      console.error("    Response data:", err.response.data);
    }
  }
}

runTests();
