import React from "react";
import { Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { getDeadlineStatus } from "../utils/dateUtils";

export default function DeadlineBadge({ deadlineDate, status = "" }) {
  const deadlineInfo = getDeadlineStatus(deadlineDate, status);

  if (!deadlineInfo.hasDeadline) {
    return <span className="text-muted text-xs">No deadline</span>;
  }

  if (deadlineInfo.isClosed) {
    return (
      <span className="deadline-badge deadline-badge-completed">
        <CheckCircle2 size={12} />
        <span>{deadlineInfo.label}</span>
      </span>
    );
  }

  const isNearbyOrOverdue = deadlineInfo.isNearby || deadlineInfo.isOverdue;

  return (
    <span
      className={`deadline-badge ${deadlineInfo.badgeClass} ${
        isNearbyOrOverdue ? "deadline-badge-pulsing" : ""
      }`}
      title={`Official Resolution Deadline: ${deadlineDate}`}
    >
      {deadlineInfo.isOverdue ? (
        <AlertTriangle size={12} className="deadline-icon-shake" />
      ) : (
        <Clock size={12} />
      )}
      <span>{deadlineInfo.label}</span>
    </span>
  );
}
