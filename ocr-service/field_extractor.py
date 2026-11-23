"""
Field Extraction Module for MedDean Document Tracker.
Extracts Reference Number, Date, From / Sender, and Subject using robust regex & heuristics.
Supports both English and Tamil administrative communications.
"""

import re
from typing import Dict, Optional

MONTH_MAP = {
    "jan": "01", "feb": "02", "mar": "03", "apr": "04",
    "may": "05", "jun": "06", "jul": "07", "aug": "08",
    "sep": "09", "oct": "10", "nov": "11", "dec": "12",
    "january": "01", "february": "02", "march": "03", "april": "04",
    "june": "06", "july": "07", "august": "08", "september": "09",
    "october": "10", "november": "11", "december": "12"
}

def clean_ocr_line(line: str) -> str:
    """Strip extra surrounding noise and normalized spaces."""
    cleaned = re.sub(r'[\r\t]', ' ', line).strip()
    return re.sub(r'\s+', ' ', cleaned)

def extract_reference_no(text: str) -> Optional[str]:
    """
    Extracts official communication reference number.
    Supports English & Tamil labels:
    - English: Ref No, Reference No, Letter No, Dispatch No, Rc.No, R.C.No, R.Dis.No, ROC.No, Lr.No, File No
    - Tamil: ந.க. எண், ந.க.எண், ந.க, கடித எண், குறிப்பு எண், அரசாணை எண், கோப்பு எண், எண்
    """
    if not text:
        return None

    patterns = [
        # Explicit bilingual labels followed by reference alphanumeric code
        r'(?i)(?:ref(?:erence)?\.?\s*(?:no|num|number)?\.?|dispatch\s*no\.?|letter\s*no\.?|file\s*no\.?|order\s*no\.?|rc\.?\s*no\.?|r\.?c\.?\s*no\.?|r\.?dis\.?\s*no\.?|roc\.?\s*no\.?|lr\.?\s*no\.?|d\.?o\.?\s*lr\.?\s*no\.?|g\.?o\.?\s*(?:ms\.?)?\s*no\.?|ந\.?\s*க\.?\s*எண்\.?|கடித\s*எண்\.?|குறிப்பு\s*எண்\.?|அரசாணை\s*எண்\.?|கோப்பு\s*எண்\.?|எண்\.?)[:\s\-]+([A-Z0-9\u0B80-\u0BFF][A-Z0-9\u0B80-\u0BFF\/\-_.:]{1,50})',
        
        # Typical administrative ref patterns e.g. MC/DEAN/2026/895, PH/2026/105, HF-2026-089, 45291/ME1/2026
        r'\b([A-Z0-9]{2,8}[\/\-_][0-9]{4}[\/\-_][0-9A-Z]{2,10})\b',
        r'\b([0-9]{3,6}[\/\-_][A-Z0-9]{2,6}[\/\-_][0-9]{4}(?:[\/\-_][A-Z0-9]{1,4})?)\b',
        r'\b([A-Z]{2,6}\-[0-9]{4}\-[0-9A-Z]{2,8})\b',
        
        # General pattern with Ref/No
        r'(?i)\b(?:ref|no)[:\s.]+([A-Z0-9]{2,10}[\/\-_][A-Z0-9\/\-_.]+)\b'
    ]

    lines = text.split('\n')
    for line in lines:
        cleaned = clean_ocr_line(line)
        for pat in patterns:
            match = re.search(pat, cleaned)
            if match:
                ref = match.group(1).strip(" .:,;-_\"'")
                # Exclude false positives like "Date", "Subject", "Tamil words meaning date"
                if not re.match(r'(?i)^(date|dated|dt|subject|sub|to|from|நாள்|தேதி|பொருள்|பார்வை)$', ref):
                    if len(ref) >= 2:
                        return ref

    # Full text search if line-by-line did not capture
    for pat in patterns:
        match = re.search(pat, text)
        if match:
            ref = match.group(1).strip(" .:,;-_\"'")
            if not re.match(r'(?i)^(date|dated|dt|subject|sub|to|from|நாள்|தேதி|பொருள்|பார்வை)$', ref):
                if len(ref) >= 2:
                    return ref

    return None

def extract_date(text: str) -> Optional[str]:
    """
    Extracts communication date and normalizes it to DD-MM-YYYY format.
    Supports English (Date, Dated, Dt) and Tamil (நாள், தேதி).
    """
    if not text:
        return None

    # 1. Look for labelled dates: Date:, Dated:, Dt:, நாள்:, தேதி:
    labeled_patterns = [
        r'(?i)(?:date|dated|dt\.?|நாள்|தேதி)[:\s\-]+([0-3]?\d[\.\/\-][0-1]?\d[\.\/\-]\d{2,4})',
        r'(?i)(?:date|dated|dt\.?|நாள்|தேதி)[:\s\-]+([0-3]?\d\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{2,4})',
        r'(?i)(?:date|dated|dt\.?|நாள்|தேதி)[:\s\-]+((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+[0-3]?\d,?\s+\d{2,4})'
    ]

    for pat in labeled_patterns:
        match = re.search(pat, text)
        if match:
            return normalize_date_string(match.group(1))

    # 2. Unlabelled standard date patterns
    general_pattern = r'\b([0-3]?\d[\.\/\-][0-1]?\d[\.\/\-]\d{4})\b'
    match = re.search(general_pattern, text)
    if match:
        return normalize_date_string(match.group(1))

    return None

def normalize_date_string(raw_date: str) -> str:
    """Normalize raw extracted date into DD-MM-YYYY."""
    raw = clean_ocr_line(raw_date).replace(',', '').strip()
    
    # Try DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY or YYYY-MM-DD
    num_match = re.match(r'^(\d{1,4})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})$', raw)
    if num_match:
        p1, p2, p3 = num_match.groups()
        if len(p1) == 4:
            # YYYY-MM-DD
            year = p1
            month = p2.zfill(2)
            day = p3.zfill(2)
        else:
            # DD-MM-YYYY or DD-MM-YY
            day = p1.zfill(2)
            month = p2.zfill(2)
            year = f"20{p3}" if len(p3) == 2 else p3
        return f"{day}-{month}-{year}"

    # Try textual month: 29 Sep 2026 or Sep 29 2026
    text_match = re.match(r'^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$', raw)
    if text_match:
        day, mon, year = text_match.groups()
        mon_num = MONTH_MAP.get(mon.lower(), "01")
        return f"{day.zfill(2)}-{mon_num}-{year}"

    text_match2 = re.match(r'^([a-zA-Z]+)\s+(\d{1,2})\s+(\d{4})$', raw)
    if text_match2:
        mon, day, year = text_match2.groups()
        mon_num = MONTH_MAP.get(mon.lower(), "01")
        return f"{day.zfill(2)}-{mon_num}-{year}"

    return raw

def extract_from(text: str) -> Optional[str]:
    """
    Extract sender/originating office.
    Supports English (From:, Sender:, Office of) and Tamil (அனுப்புநர்:, அனுப்புனர்:, பிறப்பிப்பவர்:).
    """
    if not text:
        return None

    patterns = [
        r'(?i)(?:from|sender|issued\s*by|அனுப்புநர்|அனுப்புனர்|பிறப்பிப்பவர்)[:\s\-]+([^\n\r]+)',
        r'(?i)(office\s+of\s+(?:the\s+)?[^\n\r,]+)'
    ]

    for pat in patterns:
        match = re.search(pat, text)
        if match:
            sender = clean_ocr_line(match.group(1)).strip(" .:,;-\"'")
            if 3 <= len(sender) <= 100:
                # Remove trailing words that indicate recipients
                sender = re.sub(r'(?i)\s+(?:to|பெறுநர்).*$', '', sender)
                return sender

    # Common institutional senders check
    known_senders = [
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
    ]
    for s in known_senders:
        if s.lower() in text.lower():
            return s

    return None

def extract_subject(text: str) -> Optional[str]:
    """
    Extracts subject of the administrative document.
    Supports English (Subject:, Sub:, Sub -, Regarding:) and Tamil (பொருள்:, பொருள் -, பார்வை:).
    Captures multi-line subjects and stops before next section (Sir, Madam, To, Ref, etc.).
    """
    if not text:
        return None

    lines = text.split('\n')
    for i, line in enumerate(lines):
        cleaned = clean_ocr_line(line)
        sub_match = re.match(r'(?i)^(?:subject|sub\.?|ref\/sub|பொருள்|விஷயம்)[:\s\-]+(.+)$', cleaned)
        if sub_match:
            subject_parts = [sub_match.group(1).strip(" .:,;-\"'")]
            
            # Check following lines for multi-line wrapped subject
            for j in range(i + 1, min(i + 4, len(lines))):
                next_line = clean_ocr_line(lines[j])
                if not next_line:
                    break
                # Stop if next line is another section header or greeting
                if re.match(r'(?i)^(?:sir|madam|dear|ref|reference|date|dated|to|from|with\s+reference|பார்வை|பெறுநர்|அனுப்புநர்|நாள்|ஐயா)[;:,.\s\-]', next_line):
                    break
                subject_parts.append(next_line)
            
            full_subject = " ".join(subject_parts).strip()
            # Strip trailing salutations if glued onto the same line
            full_subject = re.sub(r'(?i)\s+(?:sir|madam|dear|with\s+reference|பார்வை|ஐயா)[;:,.\s\-].*$', '', full_subject).strip()
            if 3 <= len(full_subject) <= 300:
                return full_subject

    # Fallback to general regex search across text
    general_sub = re.search(r'(?i)(?:subject|sub\.?|ref\/sub|பொருள்|விஷயம்)[:\s\-]+([^\n\r]+)', text)
    if general_sub:
        sub = clean_ocr_line(general_sub.group(1)).strip(" .:,;-\"'")
        if 3 <= len(sub) <= 250:
            return sub

    return None

def extract_fields(text: str) -> Dict[str, Optional[str]]:
    """
    Extracts all administrative fields from OCR text.
    Returns: { referenceNo, date, from, subject }
    """
    if not text or not text.strip():
        return {
            "referenceNo": None,
            "date": None,
            "from": None,
            "subject": None
        }

    return {
        "referenceNo": extract_reference_no(text),
        "date": extract_date(text),
        "from": extract_from(text),
        "subject": extract_subject(text)
    }
