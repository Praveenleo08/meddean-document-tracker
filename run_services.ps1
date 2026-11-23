# MedDean Document Tracker - PowerShell Launcher
Write-Host "==============================================================================" -ForegroundColor Cyan
Write-Host " MedDean Document Tracker - Starting All Services" -ForegroundColor Cyan
Write-Host "==============================================================================" -ForegroundColor Cyan

$scriptDir = $PSScriptRoot
$pythonExe = "C:\Users\prave\AppData\Local\Programs\Python\Python311\python.exe"

Write-Host "1. Starting Python OCR Microservice (Port 8001)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\ocr-service'; & '$pythonExe' -m uvicorn app:app --host 127.0.0.1 --port 8001 --reload"

Write-Host "2. Starting Node.js Backend API (Port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; node server.js"

Write-Host "3. Starting React Vite Frontend (Port 5173)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\frontend'; npm.cmd run dev -- --host 127.0.0.1"

Write-Host "All services started! Opening browser at http://localhost:5173..." -ForegroundColor Green
Start-Sleep -Seconds 3
Start-Process "http://localhost:5173"
