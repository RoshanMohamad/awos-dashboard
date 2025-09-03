# Vercel Environment Variables Configuration

Copy these environment variables to your Vercel dashboard:

## Required Environment Variables for Vercel

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qxivgtnfvyorrtnqmmsz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA
NEXT_PUBLIC_BASE_URL=https://awos-dashboard.vercel.app
DATABASE_URL=postgresql://postgres:8KGkAjmH2ZG5FuFQ@db.qxivgtnfvyorrtnqmmsz.supabase.co:5432/postgres
NEXT_PUBLIC_API_URL=https://awos-dashboard.vercel.app/api
```

## How to Add Environment Variables to Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Click on your `awos-dashboard` project
3. Go to "Settings" tab
4. Click on "Environment Variables" in the left sidebar
5. Add each variable above one by one:
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: `https://qxivgtnfvyorrtnqmmsz.supabase.co`
   - Environment: Select "Production", "Preview", and "Development"
   - Click "Save"
6. Repeat for all variables above

### Method 2: Vercel CLI

```bash
# Install Vercel CLI if you haven't
npm i -g vercel

# Login to Vercel
vercel login

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter: https://qxivgtnfvyorrtnqmmsz.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxMzQ1NjMsImV4cCI6MjA3MTcxMDU2M30.o2nNNZeHgi8O_9KAVjScrE6b04cvcAvNVeS1RCAM--s

vercel env add SUPABASE_SERVICE_ROLE_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4aXZndG5mdnlvcnJ0bnFtbXN6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjEzNDU2MywiZXhwIjoyMDcxNzEwNTYzfQ.1IQwg1HpHlsnyNL1To6FMDkc2jd3nO0Kfr_jsG_libA

vercel env add NEXT_PUBLIC_BASE_URL production
# Enter: https://awos-dashboard.vercel.app

vercel env add DATABASE_URL production
# Enter: postgresql://postgres:8KGkAjmH2ZG5FuFQ@db.qxivgtnfvyorrtnqmmsz.supabase.co:5432/postgres

vercel env add NEXT_PUBLIC_API_URL production
# Enter: https://awos-dashboard.vercel.app/api
```

## After Adding Environment Variables

### 1. Redeploy Your Application

```bash
# Trigger a new deployment to apply environment variables
vercel --prod

# OR push a commit to trigger automatic deployment
git add .
git commit -m "Add environment variables configuration"
git push origin main
```

### 2. Verify Environment Variables

Visit your Vercel project settings to confirm all variables are added.

### 3. Test Your Deployed App

- Visit https://awos-dashboard.vercel.app
- Check if authentication and database features work
- Test ESP32 data ingestion endpoint

## Important Notes

- **NEXT*PUBLIC*** variables are exposed to the browser
- **SUPABASE_SERVICE_ROLE_KEY** is server-side only (secure)
- **DATABASE_URL** is for direct database connections (server-side only)
- Environment variables only take effect after redeployment

## Troubleshooting

If you still see "Supabase environment variables are not configured" after adding variables:

1. **Check variable names** - they must match exactly
2. **Redeploy** - Environment variables only apply after deployment
3. **Check browser console** for any error messages
4. **Verify Supabase URL** is accessible from your browser
