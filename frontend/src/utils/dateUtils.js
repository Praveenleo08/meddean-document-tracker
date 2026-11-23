/**
 * Date and Deadline utility functions for MedDean Document Tracker
 */

// Format DD-MM-YYYY to YYYY-MM-DD for native <input type="date">
export function toDateInputValue(dStr) {
  if (!dStr) return "";
  const parts = dStr.trim().split(/[-/.]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    let year = parts[2];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return "";
}

// Format YYYY-MM-DD from <input type="date"> to DD-MM-YYYY
export function fromDateInputValue(isoStr) {
  if (!isoStr) return "";
  const parts = isoStr.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return isoStr;
}

// Get today formatted as DD-MM-YYYY
export function getTodayFormatted() {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, "0");
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const y = now.getFullYear();
  return `${d}-${m}-${y}`;
}

// Add days to today formatted as DD-MM-YYYY
export function addDaysFormatted(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

// Calculate deadline proximity and badge status
export function getDeadlineStatus(deadlineDate, status = "") {
  if (!deadlineDate || !deadlineDate.trim()) {
    return { hasDeadline: false };
  }

  if (status && status.toLowerCase() === "closed") {
    return {
      hasDeadline: true,
      isClosed: true,
      diffDays: 0,
      label: `Completed (Due: ${deadlineDate})`,
      badgeClass: "deadline-badge-completed"
    };
  }

  // Parse DD-MM-YYYY or YYYY-MM-DD
  const parts = deadlineDate.trim().split(/[-/.]/);
  let targetYear, targetMonth, targetDay;

  if (parts.length === 3) {
    if (parts[0].length === 4) {
      targetYear = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
      targetDay = parseInt(parts[2], 10);
    } else {
      targetDay = parseInt(parts[0], 10);
      targetMonth = parseInt(parts[1], 10) - 1;
      targetYear = parseInt(parts[2].length === 2 ? `20${parts[2]}` : parts[2], 10);
    }
  } else {
    return { hasDeadline: false };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(targetYear, targetMonth, targetDay);
  due.setHours(0, 0, 0, 0);

  if (isNaN(due.getTime())) {
    return { hasDeadline: false };
  }

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    return {
      hasDeadline: true,
      diffDays,
      isOverdue: true,
      isNearby: true,
      urgency: "critical",
      label: `Overdue by ${absDays} day${absDays > 1 ? "s" : ""}`,
      badgeClass: "deadline-badge-overdue"
    };
  }

  if (diffDays === 0) {
    return {
      hasDeadline: true,
      diffDays: 0,
      isToday: true,
      isNearby: true,
      urgency: "critical",
      label: "Due Today!",
      badgeClass: "deadline-badge-today"
    };
  }

  if (diffDays === 1) {
    return {
      hasDeadline: true,
      diffDays: 1,
      isTomorrow: true,
      isNearby: true,
      urgency: "high",
      label: "Due in 1 day (Tomorrow)",
      badgeClass: "deadline-badge-nearby"
    };
  }

  if (diffDays <= 3) {
    return {
      hasDeadline: true,
      diffDays,
      isNearby: true,
      urgency: "high",
      label: `Due in ${diffDays} days`,
      badgeClass: "deadline-badge-nearby"
    };
  }

  return {
    hasDeadline: true,
    diffDays,
    isNearby: false,
    urgency: "normal",
    label: `${deadlineDate} (${diffDays}d left)`,
    badgeClass: "deadline-badge-normal"
  };
}
