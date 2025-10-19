@echo off
REM ====================================================
REM AWOS Dashboard - Local Server Startup Script
REM ====================================================

echo.
echo ============================================
echo   AWOS Dashboard - Starting Local Server
echo ============================================
echo.

REM Get the script directory
cd /d "%~dp0"

echo [INFO] Project Directory: %CD%
echo.

REM Check if Node.js is installed
echo [CHECKING] Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js is not installed!
    echo.
    echo Please download and install Node.js from:
    echo https://nodejs.org/
    echo.
    pause
    exit /b 1
)

echo [OK] Node.js installed
node --version
npm --version
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [WARNING] Dependencies not installed!
    echo [INFO] Installing dependencies... This may take a few minutes...
    echo.
    call npm install
    if errorlevel 1 (
        echo [ERROR] Failed to install dependencies!
        pause
        exit /b 1
    )
    echo.
    echo [OK] Dependencies installed successfully
    echo.
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo [WARNING] .env.local file not found!
    echo [INFO] Creating default configuration...
    echo.
    
    REM Get PC IP address
    for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /c:"IPv4 Address"') do (
        set PCIP=%%a
    )
    
    REM Remove leading spaces
    set PCIP=%PCIP:~1%
    
    echo [INFO] Your PC IP Address: %PCIP%
    echo.
    echo [IMPORTANT] Please edit .env.local and configure:
    echo   - NEXT_PUBLIC_PC_IP
    echo   - NEXT_PUBLIC_ESP32_IP
    echo   - NEXT_PUBLIC_GATEWAY_IP
    echo.
)

REM Display network configuration
echo ============================================
echo   Network Configuration
echo ============================================
echo.

REM Show PC IP address
echo [PC Network Information]
ipconfig | findstr /c:"IPv4 Address" /c:"Subnet Mask" /c:"Default Gateway"
echo.

REM Show configured values from .env.local if exists
if exist ".env.local" (
    echo [Configured Settings from .env.local]
    findstr /B "NEXT_PUBLIC_PC_IP" .env.local
    findstr /B "NEXT_PUBLIC_ESP32_IP" .env.local
    findstr /B "NEXT_PUBLIC_GATEWAY_IP" .env.local
    findstr /B "NEXT_PUBLIC_SERVER_PORT" .env.local
    echo.
)

echo ============================================
echo   Starting Development Server
echo ============================================
echo.

echo [INFO] Server will be accessible at:
echo   - Local:   http://localhost:3000
echo   - Network: http://%PCIP%:3000
echo.
echo [INFO] Default Login Credentials:
echo   - Email:    admin@local.awos
echo   - Password: admin123
echo.
echo [INFO] Press Ctrl+C to stop the server
echo.
echo ============================================
echo.

REM Start the development server
npm run dev

REM If server stops
echo.
echo ============================================
echo   Server Stopped
echo ============================================
echo.
pause
