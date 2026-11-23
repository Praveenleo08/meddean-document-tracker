@echo off
title MedDean Document Tracker Launcher
echo ==============================================================================
echo  MedDean Document Tracker - Starting All Services
echo ==============================================================================
echo.

set PYTHON_EXE=C:\Users\prave\AppData\Local\Programs\Python\Python311\python.exe

echo 1. Starting Python OCR Microservice (Port 8001)...
start "MedDean OCR Service (Port 8001)" cmd /k "cd /d %~dp0ocr-service && %PYTHON_EXE% -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload"

echo 2. Starting Node.js Backend API (Port 5000)...
start "MedDean Backend API (Port 5000)" cmd /k "cd /d %~dp0backend && node server.js"

echo 3. Starting React Vite Frontend (Port 5173)...
start "MedDean React Frontend (Port 5173)" cmd /k "cd /d %~dp0frontend && npm.cmd run dev -- --host 127.0.0.1"

echo.
echo ==============================================================================
echo  All services launched!
echo  Open your web browser at: http://localhost:5173
echo ==============================================================================
timeout /t 5
start http://localhost:5173
