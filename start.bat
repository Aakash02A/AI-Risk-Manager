@echo off
setlocal enabledelayedexpansion

echo ============================================================
echo   Starting Chargeback Evidence Responder
echo   - Java Spring Boot Backend  : http://localhost:8080
echo   - Python ML Microservice    : http://localhost:5000
echo   - React 19 Frontend (Vite)  : http://localhost:3000
echo ============================================================
echo.

cd /d "%~dp0"

:: Automatically free port 3000 if currently occupied
netstat -ano | findstr /R /C:":3000 .*LISTENING" >nul 2>&1
if not errorlevel 1 (
    echo [INFO] Freeing occupied port 3000...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr /R /C:":3000 .*LISTENING"') do (
        taskkill /F /PID %%a >nul 2>&1
    )
    ping 127.0.0.1 -n 2 >nul
)

:: Ensure environment file exists
if not exist ".env" (
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo [OK] Created .env configuration.
    )
)

echo Open browser at: http://localhost:3000
echo Press Ctrl+C to stop the server.
echo.

where npm.cmd >nul 2>&1
if not errorlevel 1 (
    call npm.cmd run dev
) else (
    call npm run dev
)
