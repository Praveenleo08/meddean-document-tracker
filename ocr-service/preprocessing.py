"""
Image Preprocessing Module for MedDean OCR Service.
Includes Grayscale, Denoising, Thresholding, and Deskewing.
"""

import cv2
import numpy as np
from PIL import Image
import io

def pil_to_cv2(image: Image.Image) -> np.ndarray:
    """Convert PIL Image to OpenCV BGR numpy array."""
    if image.mode != "RGB":
        image = image.convert("RGB")
    return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

def cv2_to_pil(cv_img: np.ndarray) -> Image.Image:
    """Convert OpenCV BGR or Grayscale image to PIL Image."""
    if len(cv_img.shape) == 2:
        return Image.fromarray(cv_img)
    return Image.fromarray(cv2.cvtColor(cv_img, cv2.COLOR_BGR2RGB))

def convert_to_grayscale(img: np.ndarray) -> np.ndarray:
    """Convert OpenCV image to Grayscale if not already."""
    if len(img.shape) == 2:
        return img
    return cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

def denoise_image(gray: np.ndarray) -> np.ndarray:
    """Apply bilateral and median filtering to remove scanner/camera noise."""
    # Bilateral filter preserves sharp edges while smoothing flat regions
    denoised = cv2.bilateralFilter(gray, d=9, sigmaColor=75, sigmaSpace=75)
    return denoised

def apply_threshold(gray: np.ndarray, method: str = "otsu") -> np.ndarray:
    """Apply thresholding to generate crisp high-contrast binarized text."""
    if method == "adaptive":
        return cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 8
        )
    else:
        # Otsu's binarization automatically calculates threshold
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh

def deskew_image(gray: np.ndarray) -> np.ndarray:
    """Detect text orientation angle and deskew document."""
    try:
        # Invert colors so text is foreground
        inv = cv2.bitwise_not(gray)
        coords = np.column_stack(np.where(inv > 0))
        if len(coords) < 50:
            return gray
        
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        elif angle > 45:
            angle = 90 - angle
        else:
            angle = -angle
        
        # Only deskew if tilt is reasonable (between 0.5 and 20 degrees)
        if 0.5 < abs(angle) < 20.0:
            (h, w) = gray.shape[:2]
            center = (w // 2, h // 2)
            M = cv2.getRotationMatrix2D(center, angle, 1.0)
            rotated = cv2.warpAffine(
                gray, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
            )
            return rotated
    except Exception:
        pass
    return gray

def preprocess_for_ocr(image: Image.Image) -> Image.Image:
    """Complete preprocessing pipeline for OCR recognition."""
    cv_img = pil_to_cv2(image)
    gray = convert_to_grayscale(cv_img)
    denoised = denoise_image(gray)
    deskewed = deskew_image(denoised)
    thresholded = apply_threshold(deskewed, method="otsu")
    return cv2_to_pil(thresholded)
