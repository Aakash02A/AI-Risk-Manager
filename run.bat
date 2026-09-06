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

:: Ensure Python ML Microservice is running on port 5000
netstat -ano | findstr /R /C:":5000 .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Starting Python ML Microservice on http://localhost:5000...
    start "AI Risk Manager - ML Microservice (:5000)" /min cmd /c "cd /d "%~dp0ml" && python app.py"
) else (
    echo [OK] Python ML Microservice is already running on port 5000.
)

:: Ensure Java Spring Boot Backend is running on port 8080
netstat -ano | findstr /R /C:":8080 .*LISTENING" >nul 2>&1
if errorlevel 1 (
    echo [INFO] Starting Java Spring Boot Backend on http://localhost:8080...
    start "AI Risk Manager - Spring Boot Backend (:8080)" /min cmd /c "cd /d "%~dp0backend" && mvnw.cmd spring-boot:run"
) else (
    echo [OK] Java Spring Boot Backend is already running on port 8080.
)

echo Open browser at: http://localhost:3000
echo Press Ctrl+C to stop the Vite dev server.
echo.

where npm.cmd >nul 2>&1
if not errorlevel 1 (
    call npm.cmd run dev
) else (
    call npm run dev
)

