import React from "react";

export default function StatusBadge({ status, isOverdue = false }) {
  const normStatus = (status || "Pending").toLowerCase();

  let badgeClass = "badge-pending";
  let label = status || "Pending";

  if (normStatus === "in progress") {
    badgeClass = "badge-in-progress";
  } else if (normStatus === "submitted for closure" || normStatus === "submitted for review" || normStatus === "submitted") {
    badgeClass = "badge-submitted";
    label = "Submitted for Closure";
  } else if (normStatus === "closed") {
    badgeClass = "badge-closed";
  } else {
    badgeClass = "badge-pending";
  }

  return (
    <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
      <span className={`status-badge ${badgeClass}`}>
        <span className="status-dot"></span>
        {label}
      </span>
      {isOverdue && normStatus !== "closed" && (
        <span className="status-badge badge-overdue">Overdue</span>
      )}
    </div>
  );
}
