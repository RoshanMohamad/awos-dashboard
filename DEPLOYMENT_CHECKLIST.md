# 🚀 AWOS Dashboard Deployment Checklist

## Current Issue: ❌ Supabase Environment Variables Missing

Your local app works but deployed app shows: "Supabase environment variables are not configured. Authentication and database features are disabled"

## ✅ Quick Fix Steps

### Step 1: Add Environment Variables to Vercel

**Option A: Use Vercel Dashboard (Recommended)**

1. Go to https://vercel.com/dashboard
2. Click on your `awos-dashboard` project
3. Go to **Settings** → **Environment Variables**
4. Add these variables one by one:

```bash
NEXT_PUBLIC_SUPABASE_URL = https://qxivgtnfvyorrtnqmmsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA
NEXT_PUBLIC_BASE_URL = https://awos-dashboard.vercel.app
DATABASE_URL = postgresql://postgres:8KGkAjmH2ZG5FuFQ@db.qxivgtnfvyorrtnqmmsz.supabase.co:5432/postgres
NEXT_PUBLIC_API_URL = https://awos-dashboard.vercel.app/api
```

**For each variable:**

- Set Environment: **Production**, **Preview**, and **Development**
- Click **Save**

**Option B: Use Vercel CLI**

```bash
# Install and login
npm install -g vercel
vercel login

# Add variables (run each command and paste the value when prompted)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_API_URL production
```

### Step 2: Setup Database Tables

1. Go to your Supabase project: https://supabase.com/dashboard/project/qxivgtnfvyorrtnqmmsz
2. Click **SQL Editor** in the sidebar
3. Create a **New query**
4. Copy and paste the contents of `supabase-setup.sql`
5. Click **Run** to execute

### Step 3: Redeploy Your Application

**Option A: Trigger Automatic Deployment**

```bash
# Push a commit to trigger redeployment
git add .
git commit -m "Configure environment variables"
git push origin main
```

**Option B: Manual Redeploy via Vercel CLI**

```bash
vercel --prod
```

**Option C: Redeploy via Vercel Dashboard**

1. Go to your project in Vercel dashboard
2. Click **Deployments** tab
3. Click the three dots (**...**) on the latest deployment
4. Click **Redeploy**

### Step 4: Verify Everything Works

1. **Check Environment Variables**

   - Visit: https://awos-dashboard.vercel.app
   - Should no longer show "Supabase environment variables are not configured"

2. **Test Database Connection**

   - Try to view dashboard data
   - Check if API endpoints work

3. **Test ESP32 Integration**
   ```bash
   curl -X POST "https://awos-dashboard.vercel.app/api/ingest" \
     -H "Content-Type: application/json" \
     -d '{
       "temperature": 25.5,
       "humidity": 65.2,
       "stationId": "VCBI"
     }'
   ```

## 🔍 Troubleshooting

### Still seeing environment variable errors?

1. **Check variable names** - Must be exact (case-sensitive)
2. **Verify redeployment** - Environment variables only apply after new deployment
3. **Check browser console** - Look for specific error messages
4. **Clear browser cache** - Hard refresh your app

### Database connection issues?

1. **Run the SQL setup** - Execute `supabase-setup.sql` in Supabase SQL Editor
2. **Check database URL** - Verify it's accessible
3. **Check Supabase project** - Ensure it's not paused

### ESP32 not sending data?

1. **Check API endpoint** - Test with curl command above
2. **Verify ESP32 code** - Use the fixed version in `scripts/esp32-fixed.ino`
3. **Monitor serial output** - Check for HTTP 201 responses

## 📁 Helper Files Created

- `VERCEL_ENV_SETUP.md` - Detailed environment variables guide
- `setup-vercel-env.bat` - Windows script to help with CLI setup
- `supabase-setup.sql` - Database schema setup script
- `DEPLOYMENT_CHECKLIST.md` - This checklist

## 🎯 Expected Result

After completing these steps:

- ✅ No more "Supabase environment variables are not configured" message
- ✅ Authentication features enabled
- ✅ Database features enabled
- ✅ ESP32 can send data to your deployed app
- ✅ Real-time updates working
- ✅ Full AWOS dashboard functionality

## ⚡ Quick Commands Summary

```bash
# If you have Vercel CLI installed:
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXT_PUBLIC_BASE_URL production
vercel env add DATABASE_URL production
vercel env add NEXT_PUBLIC_API_URL production
vercel --prod

# Test your API:
curl https://awos-dashboard.vercel.app/api/ingest
```

The most common issue is forgetting to redeploy after adding environment variables. Make sure you trigger a new deployment!
