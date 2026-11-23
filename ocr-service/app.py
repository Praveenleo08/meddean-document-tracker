"""
FastAPI Server for MedDean OCR Service.
Receives uploaded document files (PDF/JPG/PNG), processes OCR,
and returns extracted text and administrative fields.
"""

import sys
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
import traceback

from ocr import process_document_ocr, _tesseract_available
from field_extractor import extract_fields

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ocr-app")

app = FastAPI(
    title="MedDean OCR Service",
    description="Intelligent OCR & Document Parsing Service for Medical College Dean's Office",
    version="1.0.0"
)

# Enable CORS for local backend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    """Health check endpoint providing engine status."""
    return {
        "status": "healthy",
        "service": "MedDean OCR Service",
        "tesseractAvailable": _tesseract_available
    }

@app.post("/ocr")
async def ocr_endpoint(file: UploadFile = File(...)):
    """
    Accepts multipart document file upload (PDF, PNG, JPG, JPEG).
    Executes image preprocessing and OCR.
    Extracts administrative fields: Reference No, Date, From, Subject.
    """
    try:
        filename = file.filename or "uploaded_file"
        file_bytes = await file.read()

        if not file_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded.")

        logger.info(f"Received file for OCR: {filename} ({len(file_bytes)} bytes)")

        # Run OCR extraction
        raw_text = process_document_ocr(file_bytes, filename)
        logger.info(f"Raw OCR text length: {len(raw_text)}")

        # Extract structured fields
        fields = extract_fields(raw_text)
        logger.info(f"Extracted fields: {fields}")

        return JSONResponse(content={
            "success": True,
            "filename": filename,
            "rawText": raw_text,
            "fields": fields
        })

    except Exception as e:
        logger.error(f"OCR processing failure: {e}\n{traceback.format_exc()}")
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "error": str(e),
                "rawText": "",
                "fields": {
                    "referenceNo": None,
                    "date": None,
                    "from": None,
                    "subject": None
                }
            }
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8001, reload=True)
