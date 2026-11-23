"""
Modular OCR Engine for MedDean Document Tracker.
Supports Tesseract OCR, EasyOCR, and pluggable architecture for PaddleOCR.
Handles both image files (JPG, PNG) and PDF documents.
Configured with UTF-8 encoding for Windows and Tamil / English administrative letter parsing.
"""

import sys
import os
import shutil
import io
import logging
from typing import Optional, List
from PIL import Image
import pypdfium2 as pdfium
import numpy as np

# Ensure Windows console encoding does not crash on Unicode / progress bars
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from preprocessing import preprocess_for_ocr

logger = logging.getLogger("ocr-engine")
logging.basicConfig(level=logging.INFO)

# Global OCR engines
_easyocr_reader = None
_tesseract_available = False

def detect_tesseract_cmd() -> Optional[str]:
    """Finds tesseract executable in standard paths or PATH."""
    env_path = os.environ.get("TESSERACT_CMD")
    if env_path and os.path.exists(env_path):
        return env_path
    
    candidates = [
        shutil.which("tesseract"),
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expanduser(r"~\AppData\Local\Programs\Tesseract-OCR\tesseract.exe"),
        r"C:\tools\tesseract\tesseract.exe"
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None

# Configure Tesseract
try:
    import pytesseract
    tesseract_path = detect_tesseract_cmd()
    if tesseract_path:
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        _tesseract_available = True
        logger.info(f"Tesseract OCR initialized from: {tesseract_path}")
    else:
        logger.info("Tesseract binary not found in standard paths. Falling back to EasyOCR.")
except ImportError:
    pytesseract = None
    logger.warning("pytesseract package not available.")

def get_easyocr_reader():
    """Lazily load EasyOCR reader on demand with cached detection & recognition models."""
    global _easyocr_reader
    if _easyocr_reader is None:
        try:
            import easyocr
            logger.info("Initializing EasyOCR reader (English / Alphanumeric)...")
            _easyocr_reader = easyocr.Reader(['en'], gpu=False)
            logger.info("EasyOCR reader initialized successfully.")
        except Exception as e:
            logger.warning(f"EasyOCR initialization failed: {e}")
            _easyocr_reader = None  # Don't cache False so subsequent calls can retry
    return _easyocr_reader

def ocr_image_with_easyocr(image: Image.Image) -> str:
    """Run EasyOCR on a PIL image."""
    reader = get_easyocr_reader()
    if not reader:
        return ""
    try:
        rgb_image = image.convert("RGB")
        img_np = np.array(rgb_image)
        results = reader.readtext(img_np, detail=0, paragraph=True)
        return "\n".join(results)
    except Exception as e:
        logger.warning(f"EasyOCR extraction error: {e}")
        return ""

def ocr_image_with_tesseract(image: Image.Image) -> str:
    """Run Tesseract OCR on a PIL image."""
    if not _tesseract_available or pytesseract is None:
        return ""
    try:
        custom_config = r'--oem 3 --psm 3'
        return pytesseract.image_to_string(image, config=custom_config)
    except Exception as e:
        logger.warning(f"Tesseract extraction error: {e}")
        return ""

def perform_ocr_on_pil_image(image: Image.Image) -> str:
    """
    Extracts text from PIL image.
    Passes original image to EasyOCR first (as neural nets perform best on natural RGB).
    Falls back to preprocessed binarized image if needed.
    """
    # 1. Try EasyOCR on original image
    text = ocr_image_with_easyocr(image)
    if text and len(text.strip()) > 10:
        return text

    # 2. Try with preprocessing (grayscale, bilateral denoising, deskew)
    try:
        processed = preprocess_for_ocr(image)
        processed_text = ocr_image_with_easyocr(processed)
        if processed_text and len(processed_text.strip()) > len(text.strip()):
            return processed_text
    except Exception as e:
        logger.warning(f"Preprocessing OCR error: {e}")

    # 3. Try Tesseract if available
    if _tesseract_available:
        tess_text = ocr_image_with_tesseract(image)
        if tess_text and len(tess_text.strip()) > 0:
            return tess_text

    return text or ""

def process_pdf_document(file_bytes: bytes) -> str:
    """
    Extracts text from PDF document using PyPdfium2.
    1. First checks for embedded digital text layer across pages (preserves Tamil & English Unicode perfectly).
    2. If text layer is missing or scanned images, renders pages at 200 DPI and executes OCR.
    """
    text_content = []
    try:
        pdf = pdfium.PdfDocument(file_bytes)
        num_pages = len(pdf)
        logger.info(f"Processing PDF document with {num_pages} pages")
        
        # Check text layer of pages
        for i in range(min(num_pages, 5)):
            page = pdf[i]
            textpage = page.get_textpage()
            page_text = textpage.get_text_range()
            if page_text and len(page_text.strip()) > 20:
                text_content.append(page_text.strip())
        
        # If sufficient embedded text found (digital PDF), return it
        combined = "\n\n".join(text_content)
        if len(combined.strip()) > 30:
            logger.info(f"Extracted digital text layer from PDF ({len(combined)} chars)")
            return combined

        # Otherwise, render pages as images and run OCR (scanned PDF case)
        logger.info("PDF appears to be a scanned document without embedded text layer. Running OCR on rendered pages...")
        ocr_results = []
        for i in range(min(num_pages, 2)):
            page = pdf[i]
            # Render at 200 DPI (scale=200/72) for fast and crisp OCR
            pil_image = page.render(scale=200/72).to_pil()
            page_ocr = perform_ocr_on_pil_image(pil_image)
            if page_ocr:
                ocr_results.append(page_ocr)

        return "\n\n".join(ocr_results)

    except Exception as e:
        logger.error(f"Error processing PDF: {e}")
    
    return ""

def process_document_ocr(file_bytes: bytes, filename: str) -> str:
    """
    Main entry point for processing any document file (PDF, PNG, JPG, JPEG).
    Returns extracted raw text.
    """
    ext = filename.lower().split('.')[-1] if '.' in filename else ''
    
    if ext == 'pdf':
        return process_pdf_document(file_bytes)
    
    # Process image (PNG, JPG, JPEG)
    try:
        image = Image.open(io.BytesIO(file_bytes))
        return perform_ocr_on_pil_image(image)
    except Exception as e:
        logger.error(f"Failed to open image: {e}")
        return ""
