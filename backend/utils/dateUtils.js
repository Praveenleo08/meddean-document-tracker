/**
 * Date utility helpers for MedDean Document Tracker
 * Standard administrative format: DD-MM-YYYY (e.g. 29-09-2026)
 */

function formatDateReadable(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatDateTimeReadable(date = new Date()) {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function parseToStandardDate(input) {
  if (!input) return formatDateReadable();
  // Handle formats like DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
  const partsMatch = input.match(/^(\d{1,4})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (partsMatch) {
    let [_, p1, p2, p3] = partsMatch;
    if (p1.length === 4) {
      // YYYY-MM-DD
      return `${p3.padStart(2, "0")}-${p2.padStart(2, "0")}-${p1}`;
    } else {
      // DD-MM-YYYY or DD-MM-YY
      if (p3.length === 2) p3 = `20${p3}`;
      return `${p1.padStart(2, "0")}-${p2.padStart(2, "0")}-${p3}`;
    }
  }
  return formatDateReadable(new Date(input)) || input;
}

module.exports = {
  formatDateReadable,
  formatDateTimeReadable,
  parseToStandardDate
};
