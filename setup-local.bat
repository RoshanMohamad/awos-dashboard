@echo off
REM AWOS Dashboard - Local Setup Script for Windows

echo ========================================
echo AWOS Dashboard - Local Network Setup
echo ========================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/5] Node.js detected: 
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed!
    pause
    exit /b 1
)

echo [2/5] npm detected:
npm --version
echo.

REM Create data directory if it doesn't exist
echo [3/5] Creating data directory...
if not exist "data" (
    mkdir data
    echo [] > data\sensor_readings.json
    echo Data directory created.
) else (
    echo Data directory already exists.
)
echo.

REM Install dependencies
echo [4/5] Installing dependencies...
echo This may take a few minutes...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to install dependencies!
    pause
    exit /b 1
)
echo.

REM Display network configuration
echo [5/5] Network Configuration Check
echo ========================================
echo.
echo Please verify your network settings:
echo.
echo Recommended Configuration:
echo   - Router Gateway:  192.168.1.1
echo   - PC Server IP:    192.168.1.100
echo   - ESP32 IP:        192.168.1.177
echo   - Subnet Mask:     255.255.255.0
echo.
echo Current Network Information:
ipconfig | findstr /C:"IPv4" /C:"Subnet"
echo.

echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next Steps:
echo.
echo 1. Configure your network adapter with static IP (192.168.1.100)
echo 2. Update ESP32 code with your network settings
echo 3. Flash ESP32 with: scripts\esp32-Local-Ethernet.ino
echo 4. Run the server with: npm run dev
echo 5. Access dashboard at: http://192.168.1.100:3000
echo.
echo Default Login:
echo   Email: admin@local.awos
echo   Password: admin123
echo.
echo For detailed instructions, see: LOCAL_SETUP_README.md
echo.
pause
