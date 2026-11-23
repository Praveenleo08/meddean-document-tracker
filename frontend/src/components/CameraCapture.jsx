import React, { useRef, useState, useEffect } from "react";
import { Camera, RefreshCw, Check, X, AlertTriangle } from "lucide-react";

export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [cameraError, setCameraError] = useState("");

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError("");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn("Direct camera access issue:", err);
      setCameraError(
        "Direct webcam stream not available or permission denied. You can also use file camera capture."
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_scan_${Date.now()}.jpg`, {
          type: "image/jpeg"
        });
        const previewUrl = URL.createObjectURL(blob);
        setCapturedImage({ file, previewUrl });
      }
    }, "image/jpeg", 0.95);
  };

  const handleRetake = () => {
    if (capturedImage?.previewUrl) {
      URL.revokeObjectURL(capturedImage.previewUrl);
    }
    setCapturedImage(null);
  };

  const handleConfirm = () => {
    if (capturedImage?.file) {
      stopCamera();
      onCapture(capturedImage.file, capturedImage.previewUrl);
    }
  };

  return (
    <div className="camera-modal-overlay">
      <div className="camera-modal-container">
        <div className="camera-modal-header">
          <h3>
            <Camera size={20} /> Capture Document with Camera
          </h3>
          <button className="btn-icon" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="camera-viewfinder-container">
          {cameraError ? (
            <div className="camera-error-box">
              <AlertTriangle size={36} className="text-warning" />
              <p>{cameraError}</p>
              <div className="native-capture-fallback">
                <label className="btn btn-primary">
                  <span>Open Device Camera</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const file = e.target.files[0];
                        onCapture(file, URL.createObjectURL(file));
                      }
                    }}
                  />
                </label>
              </div>
            </div>
          ) : capturedImage ? (
            <div className="captured-preview">
              <img src={capturedImage.previewUrl} alt="Captured Document" />
            </div>
          ) : (
            <div className="video-stream-box">
              <video ref={videoRef} autoPlay playsInline className="camera-video" />
              <div className="viewfinder-guide">
                <div className="guide-box">Align document within borders</div>
              </div>
            </div>
          )}
        </div>

        <div className="camera-modal-footer">
          {capturedImage ? (
            <div className="capture-controls">
              <button className="btn btn-secondary" onClick={handleRetake}>
                <RefreshCw size={16} /> Retake
              </button>
              <button className="btn btn-success" onClick={handleConfirm}>
                <Check size={16} /> Use This Photo
              </button>
            </div>
          ) : (
            !cameraError && (
              <div className="capture-controls">
                <button className="btn btn-primary btn-lg capture-snap-btn" onClick={takeSnapshot}>
                  <Camera size={20} /> Take Photo
                </button>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
