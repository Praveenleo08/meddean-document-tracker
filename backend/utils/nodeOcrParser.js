/**
 * Node.js OCR Field Extraction and Refinement Parser.
 * Complements Python OCR service with secondary heuristic normalization and verification.
 * Supports both English and Tamil administrative correspondence.
 * Extracts: Reference Number, Date, From, Subject.
 */

const { parseToStandardDate } = require("./dateUtils");

function cleanLine(line) {
  if (!line) return "";
  return line.replace(/[\r\t]+/g, " ").replace(/\s+/g, " ").trim();
}

function extractReferenceNo(text) {
  if (!text) return null;
  const lines = text.split("\n");

  const patterns = [
    // Explicit bilingual labels followed by reference alphanumeric code
    /(?:ref(?:erence)?\.?\s*(?:no|num|number)?\.?|dispatch\s*no\.?|letter\s*no\.?|file\s*no\.?|order\s*no\.?|rc\.?\s*no\.?|r\.?c\.?\s*no\.?|r\.?dis\.?\s*no\.?|roc\.?\s*no\.?|lr\.?\s*no\.?|d\.?o\.?\s*lr\.?\s*no\.?|g\.?o\.?\s*(?:ms\.?)?\s*no\.?|ந\.?\s*க\.?\s*எண்\.?|கடித\s*எண்\.?|குறிப்பு\s*எண்\.?|அரசாணை\s*எண்\.?|கோப்பு\s*எண்\.?|எண்\.?)[:\s\-]+([A-Z0-9\u0B80-\u0BFF][A-Z0-9\u0B80-\u0BFF\/\-_.:]{1,50})/i,
    
    // Typical administrative ref patterns e.g. MC/DEAN/2026/895, PH/2026/105, HF-2026-089, 45291/ME1/2026
    /\b([A-Z0-9]{2,8}[\/\-_][0-9]{4}[\/\-_][0-9A-Z]{2,10})\b/,
    /\b([0-9]{3,6}[\/\-_][A-Z0-9]{2,6}[\/\-_][0-9]{4}(?:[\/\-_][A-Z0-9]{1,4})?)\b/,
    /\b([A-Z]{2,6}\-[0-9]{4}\-[0-9A-Z]{2,8})\b/,
    
    // General pattern with Ref/No
    /\b(?:ref|no)[:\s.]+([A-Z0-9]{2,10}[\/\-_][A-Z0-9\/\-_.]+)\b/i
  ];

  for (const line of lines) {
    const trimmed = cleanLine(line);
    for (const pat of patterns) {
      const match = trimmed.match(pat);
      if (match && match[1]) {
        const val = match[1].replace(/[.,:;_\-"']+$/, "").trim();
        if (!/^(date|dated|dt|subject|sub|to|from|நாள்|தேதி|பொருள்|பார்வை)$/i.test(val)) {
          if (val.length >= 2) return val;
        }
      }
    }
  }

  for (const pat of patterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const val = match[1].replace(/[.,:;_\-"']+$/, "").trim();
      if (!/^(date|dated|dt|subject|sub|to|from|நாள்|தேதி|பொருள்|பார்வை)$/i.test(val)) {
        if (val.length >= 2) return val;
      }
    }
  }

  return null;
}

function extractDate(text) {
  if (!text) return null;

  // Labeled date: Date, Dated, Dt, நாள், தேதி
  const labeled = text.match(/(?:date|dated|dt\.?|நாள்|தேதி)[:\s\-]+([0-3]?\d[\.\/\-][0-1]?\d[\.\/\-]\d{2,4}|\d{1,2}\s+[a-zA-Z]+\s+\d{4})/i);
  if (labeled && labeled[1]) {
    return parseToStandardDate(labeled[1].trim());
  }

  // General date pattern
  const general = text.match(/\b([0-3]?\d[\.\/\-][0-1]?\d[\.\/\-]\d{4})\b/);
  if (general && general[1]) {
    return parseToStandardDate(general[1].trim());
  }

  return null;
}

function extractFrom(text) {
  if (!text) return null;
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = cleanLine(line);
    const fromMatch = trimmed.match(/^(?:from|sender|issued\s*by|அனுப்புநர்|அனுப்புனர்|பிறப்பிப்பவர்)[:\s\-]+(.+)$/i);
    if (fromMatch && fromMatch[1]) {
      let candidate = fromMatch[1].replace(/[.,:;_\-"']+$/, "").trim();
      candidate = candidate.replace(/\s+(?:to|பெறுநர்).*$/i, "");
      if (candidate.length >= 3 && candidate.length <= 100) {
        return candidate;
      }
    }
    const officeMatch = trimmed.match(/^(office\s+of\s+(?:the\s+)?.+)$/i);
    if (officeMatch && officeMatch[1]) {
      return officeMatch[1].trim();
    }
  }

  // Common institutional senders check
  const knownSenders = [
    "Hostel Warden",
    "Student Affairs",
    "Dean Office",
    "Medical Council of India",
    "National Medical Commission",
    "Director of Medical Education",
    "மருத்துவக் கல்வி இயக்குநர்",
    "District Collector",
    "மாவட்ட ஆட்சியர்",
    "District Health Authority",
    "Ministry of Health",
    "State Health Department",
    "University Examinations Branch",
    "Finance Department",
    "Procurement Committee",
    "Medical Superintendent"
  ];
  for (const s of knownSenders) {
    if (text.toLowerCase().includes(s.toLowerCase())) {
      return s;
    }
  }

  return null;
}

function extractSubject(text) {
  if (!text) return null;
  const lines = text.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const trimmed = cleanLine(lines[i]);
    const subMatch = trimmed.match(/^(?:subject|sub\.?|ref\/sub|பொருள்|விஷயம்)[:\s\-]+(.+)$/i);
    if (subMatch && subMatch[1]) {
      const subjectParts = [subMatch[1].replace(/[.,:;_\-"']+$/, "").trim()];
      
      // Capture wrapped subject lines up to 3 lines
      for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
        const nextLine = cleanLine(lines[j]);
        if (!nextLine) break;
        if (/^(?:sir|madam|dear|ref|reference|date|dated|to|from|with\s+reference|பார்வை|பெறுநர்|அனுப்புநர்|நாள்|ஐயா)[;:,.\s\-]/i.test(nextLine)) {
          break;
        }
        subjectParts.push(nextLine);
      }
      
      let fullSubject = subjectParts.join(" ").trim();
      fullSubject = fullSubject.replace(/\s+(?:sir|madam|dear|with\s+reference|பார்வை|ஐயா)[;:,.\s\-].*$/i, "").trim();
      if (fullSubject.length >= 3 && fullSubject.length <= 300) {
        return fullSubject;
      }
    }
  }

  // Fallback regex
  const fallback = text.match(/(?:subject|sub\.?|ref\/sub|பொருள்|விஷயம்)[:\s\-]+([^\n\r]+)/i);
  if (fallback && fallback[1]) {
    const sub = cleanLine(fallback[1]);
    if (sub.length >= 3 && sub.length <= 250) {
      return sub;
    }
  }

  return null;
}

function refineFields(pythonFields, rawText) {
  const extractedRef = extractReferenceNo(rawText);
  const extractedDate = extractDate(rawText);
  const extractedFrom = extractFrom(rawText);
  const extractedSub = extractSubject(rawText);

  return {
    referenceNo: pythonFields.referenceNo || extractedRef || "",
    date: pythonFields.date ? parseToStandardDate(pythonFields.date) : (extractedDate || ""),
    from: pythonFields.from || extractedFrom || "",
    subject: pythonFields.subject || extractedSub || ""
  };
}

module.exports = {
  extractReferenceNo,
  extractDate,
  extractFrom,
  extractSubject,
  refineFields
};
