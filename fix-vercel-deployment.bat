@echo off
echo ============================================
echo VERCEL ENVIRONMENT VARIABLES SETUP
echo ============================================
echo.

REM Check if vercel is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Installing Vercel CLI...
    call npm install -g vercel
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo Vercel CLI is ready!
echo.

echo Logging into Vercel...
echo Please follow the authentication steps in your browser.
call vercel login

echo.
echo Navigating to project directory...
cd /d "c:\Users\saraf\OneDrive - University of Moratuwa\awos-dashboard new"

echo.
echo Setting up environment variables...
echo.

echo [1/6] Adding NEXT_PUBLIC_SUPABASE_URL...
echo https://qxivgtnfvyorrtnqmmsz.supabase.co | vercel env add NEXT_PUBLIC_SUPABASE_URL production

echo [2/6] Adding NEXT_PUBLIC_SUPABASE_ANON_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

echo [3/6] Adding SUPABASE_SERVICE_ROLE_KEY...
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA | vercel env add SUPABASE_SERVICE_ROLE_KEY production

echo [4/6] Adding NEXT_PUBLIC_BASE_URL...
echo https://awos-dashboard.vercel.app | vercel env add NEXT_PUBLIC_BASE_URL production

echo [5/6] Adding DATABASE_URL...
echo postgresql://postgres:8KGkAjmH2ZG5FuFQ@db.qxivgtnfvyorrtnqmmsz.supabase.co:5432/postgres | vercel env add DATABASE_URL production

echo [6/6] Adding NEXT_PUBLIC_API_URL...
echo https://awos-dashboard.vercel.app/api | vercel env add NEXT_PUBLIC_API_URL production

echo.
echo Triggering production deployment...
call vercel --prod

echo.
echo ============================================
echo ✅ SETUP COMPLETE!
echo ============================================
echo.
echo Your AWOS Dashboard should now be fully functional at:
echo 🌐 https://awos-dashboard.vercel.app
echo.
echo ✅ Supabase authentication enabled
echo ✅ Database features enabled  
echo ✅ Real-time updates enabled
echo.
echo Test your API:
echo curl -X POST "https://awos-dashboard.vercel.app/api/ingest" ^
echo   -H "Content-Type: application/json" ^
echo   -d "{\"temperature\":27.5,\"humidity\":70.0,\"pressure\":1012.0,\"stationId\":\"VCBI\"}"
echo.
pause
