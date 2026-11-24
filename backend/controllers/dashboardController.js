/**
 * Dashboard Controller for MedDean Document Tracker.
 * Delivers role-aware metrics, KPI cards, department summaries, and Google Sheets status.
 */

const googleSheetsService = require("../services/googleSheetsService");
const {
  DEPARTMENTS,
  INCOMING_SENDERS,
  COLLEGE_SECTIONS,
  HOSPITAL_SECTIONS,
  ALL_SECTIONS
} = require("../config/departments");

class DashboardController {
  async getSummary(req, res) {
    try {
      const user = req.user;

      if (user.role === "section" || user.role === "department") {
        // Department / Section user KPI and summary
        const deptDocs = await googleSheetsService.getAllCommunicationsByDepartment(user.department);
        const total = deptDocs.length;
        const pending = deptDocs.filter(d => (d.status || "").toLowerCase() === "pending").length;
        const inProgress = deptDocs.filter(d => (d.status || "").toLowerCase() === "in progress").length;
        const submittedForClosure = deptDocs.filter(d => {
          const st = (d.status || "").toLowerCase();
          return st === "submitted for closure" || st === "submitted for review";
        }).length;
        const closed = deptDocs.filter(d => (d.status || "").toLowerCase() === "closed").length;
        const urgent = deptDocs.filter(d => (d.isUrgent === true || d.isUrgent === "YES") && (d.status || "").toLowerCase() !== "closed").length;

        const recent = deptDocs.slice(0, 5);

        return res.status(200).json({
          success: true,
          role: "department",
          department: user.department,
          metrics: {
            total,
            pending,
            inProgress,
            submittedForClosure,
            closed,
            urgent
          },
          recent,
          sheetsStatus: googleSheetsService.getConnectionStatus()
        });
      }

      // Admin KPI and summary
      const metrics = await googleSheetsService.getOverallMetrics();
      const departmentSummary = await googleSheetsService.getDepartmentSummary();
      const allDocs = await googleSheetsService.getAllCommunications();
      const recent = allDocs.slice(0, 8);
      const pendingAll = allDocs.filter(d => (d.status || "").toLowerCase() !== "closed").slice(0, 8);

      return res.status(200).json({
        success: true,
        role: "admin",
        metrics,
        departmentSummary,
        recent,
        pendingAll,
        sheetsStatus: googleSheetsService.getConnectionStatus()
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: "Failed to load dashboard summary: " + err.message
      });
    }
  }

  getDepartments(req, res) {
    return res.status(200).json({
      success: true,
      departments: DEPARTMENTS,
      incomingSenders: INCOMING_SENDERS,
      collegeSections: COLLEGE_SECTIONS,
      hospitalSections: HOSPITAL_SECTIONS,
      allSections: ALL_SECTIONS
    });
  }

  getSheetsStatus(req, res) {
    return res.status(200).json({
      success: true,
      sheetsStatus: googleSheetsService.getConnectionStatus()
    });
  }
}

module.exports = new DashboardController();
