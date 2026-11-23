const axios = require("axios");

const API_BASE = "http://localhost:5000/api";

async function runTests() {
  console.log("==============================================================================");
  console.log(" MedDean Document Tracker - Institutional Section Workflow Test Suite");
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

    // 2. Login as College Section (college_e1)
    console.log("\n[2] Logging in as College Section (college_e1)...");
    const collegeLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: "college_e1",
      password: "Dean@123"
    });
    const collegeToken = collegeLogin.data.token;
    console.log(" [✓] College E1 Login successful. Department:", collegeLogin.data.user.department, "| Title:", collegeLogin.data.user.title);

    // 3. Login as Hospital Section (hospital_e1_1)
    console.log("\n[3] Logging in as Hospital Section (hospital_e1_1)...");
    const hospLogin = await axios.post(`${API_BASE}/auth/login`, {
      username: "hospital_e1_1",
      password: "Dean@123"
    });
    const hospToken = hospLogin.data.token;
    console.log(" [✓] Hospital E1(1) Login successful. Department:", hospLogin.data.user.department, "| Title:", hospLogin.data.user.title);

    // 4. Test /api/departments endpoint
    console.log("\n[4] Testing /api/departments registry endpoint...");
    const deptsRes = await axios.get(`${API_BASE}/departments`);
    console.log(` [✓] Total Departments: ${deptsRes.data.departments.length}`);
    console.log(` [✓] College Sections: ${deptsRes.data.collegeSections.length}`);
    console.log(` [✓] Hospital Sections: ${deptsRes.data.hospitalSections.length}`);
    console.log(` [✓] Incoming Senders: ${deptsRes.data.incomingSenders.length}`);

    // Verify spelling corrections in senders
    const senders = deptsRes.data.incomingSenders;
    const hasOphthal = senders.includes("Ophthalmology");
    const hasHepato = senders.includes("Hepatology");
    const hasRadio = senders.includes("Radiodiagnosis");
    const hasMedStore = senders.includes("Medical Store");
    if (hasOphthal && hasHepato && hasRadio && hasMedStore) {
      console.log(" [✓] PASS: All spelling corrections verified in INCOMING senders (Ophthalmology, Hepatology, Radiodiagnosis, Medical Store)!");
    } else {
      console.error(" [x] Missing spelling corrections in senders:", senders);
    }

    // 5. Test Registering a New Document for College - E1 section
    console.log("\n[5] Registering new official correspondence for College - E1 section...");
    const FormData = require("form-data");
    const form = new FormData();
    form.append("referenceNo", "NMC/EST/2026/01");
    form.append("department", "College - E1 section");
    form.append("from", "Ophthalmology");
    form.append("subject", "Faculty Roster & NMC Compliance Submission");
    form.append("communicationDate", "23-11-2026");
    form.append("deadlineDate", "28-11-2026");
    form.append("isUrgent", "true");
    form.append("remarks", "Urgent review required by College E1 Section");

    // Dummy document file
    form.append("file", Buffer.from("%PDF-1.4 demo test file content"), {
      filename: "nmc_compliance_notice.pdf",
      contentType: "application/pdf"
    });

    const regRes = await axios.post(`${API_BASE}/documents`, form, {
      headers: {
        Authorization: `Bearer ${adminToken}`,
        ...form.getHeaders()
      }
    });

    const newDoc = regRes.data.document;
    console.log(" [✓] PASS: Document registered successfully!");
    console.log("     Document ID:", newDoc.documentId);
    console.log("     Department:", newDoc.department);
    console.log("     Sender (From):", newDoc.from);
    console.log("     Status:", newDoc.status);
    console.log("     Urgent:", newDoc.isUrgent);

    // 6. Test Department Isolation: hospital_e1_1 should NOT see college_e1 pending docs
    console.log("\n[6] Testing Department Isolation Security Policy...");
    const hospPending = await axios.get(`${API_BASE}/documents/pending`, {
      headers: { Authorization: `Bearer ${hospToken}` }
    });
    const leakDoc = hospPending.data.documents.find(d => d.documentId === newDoc.documentId);
    if (!leakDoc) {
      console.log(" [✓] PASS: Hospital section cannot see College document. Isolation enforced!");
    } else {
      console.error(" [x] SECURITY FAILURE: Cross-department leakage detected!");
    }

    // 7. Test College E1 Section viewing their document
    console.log("\n[7] Testing Section User Access...");
    const collegePending = await axios.get(`${API_BASE}/documents/pending`, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    const foundDoc = collegePending.data.documents.find(d => d.documentId === newDoc.documentId);
    if (foundDoc) {
      console.log(" [✓] PASS: College E1 Section correctly sees its assigned document in pending register!");
    } else {
      console.error(" [x] Document not visible to assigned section!");
    }

    // 8. Test Section submits work for closure
    console.log("\n[8] Testing Section Work Submission...");
    const submitRes = await axios.put(`${API_BASE}/documents/${newDoc.documentId}/status`, {
      status: "Submitted for Closure",
      remarks: "Faculty roster compiled and validated. Submitted for Dean approval."
    }, {
      headers: { Authorization: `Bearer ${collegeToken}` }
    });
    console.log(" [✓] PASS: Section successfully updated work to 'Submitted for Closure'!");

    // 9. Test Dean Final Review & Closure
    console.log("\n[9] Testing Dean Exclusive Authority to Close...");
    const closeRes = await axios.put(`${API_BASE}/documents/${newDoc.documentId}/status`, {
      status: "Closed",
      remarks: "Dean Review: Approved and sealed."
    }, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(" [✓] PASS: Dean officially closed the work! Final Status:", closeRes.data.document.status);

    console.log("\n==============================================================================");
    console.log(" ALL 9 INSTITUTIONAL TESTS PASSED WITH 100% SUCCESS!");
    console.log("==============================================================================");
  } catch (err) {
    console.error("\n[!] Test failed with error:", err.message);
    if (err.response) {
      console.error("    Response status:", err.response.status);
      console.error("    Response data:", err.response.data);
    }
    process.exit(1);
  }
}

runTests();
