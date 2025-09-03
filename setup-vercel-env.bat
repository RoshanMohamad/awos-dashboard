@echo off
echo ====================================================
echo AWOS Dashboard - Vercel Environment Variables Setup
echo ====================================================
echo.

echo This script will help you add environment variables to Vercel
echo Make sure you have Vercel CLI installed and are logged in
echo.

echo Step 1: Install Vercel CLI (if not already installed)
echo Run: npm install -g vercel
echo.

echo Step 2: Login to Vercel (if not already logged in)
echo Run: vercel login
echo.

echo Step 3: Link your project (if not already linked)
echo Run: vercel link
echo.

echo Step 4: Add Environment Variables
echo Copy and run these commands one by one:
echo.

echo vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo # Paste: https://qxivgtnfvyorrtnqmmsz.supabase.co
echo.

echo vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo # Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s
echo.

echo vercel env add SUPABASE_SERVICE_ROLE_KEY production
echo # Paste: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA
echo.

echo vercel env add NEXT_PUBLIC_BASE_URL production
echo # Paste: https://awos-dashboard.vercel.app
echo.

echo vercel env add DATABASE_URL production
echo # Paste: postgresql://postgres:8KGkAjmH2ZG5FuFQ@db.qxivgtnfvyorrtnqmmsz.supabase.co:5432/postgres
echo.

echo vercel env add NEXT_PUBLIC_API_URL production
echo # Paste: https://awos-dashboard.vercel.app/api
echo.

echo Step 5: Redeploy your application
echo Run: vercel --prod
echo.

echo ====================================================
echo Alternative: Use Vercel Dashboard (Easier)
echo ====================================================
echo 1. Go to https://vercel.com/dashboard
echo 2. Click on your awos-dashboard project
echo 3. Go to Settings ^> Environment Variables
echo 4. Add each variable from VERCEL_ENV_SETUP.md
echo 5. Redeploy from the Deployments tab
echo ====================================================
echo.

pause
