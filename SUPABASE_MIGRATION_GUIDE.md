# AWOS Dashboard - Supabase Migration Guide

## Overview

This guide helps you complete the migration from NextAuth + PostgreSQL/Prisma to Supabase for both authentication and database management.

## Prerequisites

- Supabase account (https://supabase.com)
- Updated environment variables
- Node.js dependencies installed

## Step 1: Create Supabase Project

1. Go to https://supabase.com and sign up/login
2. Create a new project:

   - Organization: Select or create
   - Project Name: `awos-dashboard`
   - Database Password: Generate a strong password
   - Region: Choose closest to your users

3. Wait for project to be ready (1-2 minutes)

## Step 2: Get Project Credentials

From your Supabase project dashboard:

1. Go to Settings > API
2. Copy the following values:
   - Project URL
   - Project API keys (anon/public and service_role)

## Step 3: Update Environment Variables

Update your `.env.local` file with the Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Google OAuth (keep existing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
```

## Step 4: Create Database Schema

1. In Supabase Dashboard, go to SQL Editor
2. Run the migration SQL from `supabase/migrations/001_create_sensor_readings.sql`
3. Verify the `sensor_readings` table is created under Database > Tables

## Step 5: Configure Authentication

### Enable Google OAuth:

1. Go to Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials:
   - Client ID: `your_google_client_id`
   - Client Secret: `your_google_client_secret`
4. Add authorized redirect URLs:
   - `http://localhost:3000/auth/callback` (development)
   - `https://yourdomain.com/auth/callback` (production)

### Configure Email Authentication (optional):

1. Enable Email provider if you want email/password auth
2. Configure email templates under Authentication > Email Templates

## Step 6: Update Application Layout

Replace `NextAuthProvider` with `AuthProvider` in your app layout:

```tsx
// app/layout.tsx
import { AuthProvider } from "@/contexts/auth-context";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

## Step 7: Test the Migration

### Test Authentication:

1. Start your development server: `npm run dev`
2. Navigate to `/login`
3. Try signing in with Google
4. Verify user appears in Supabase Dashboard > Authentication > Users

### Test Database:

1. Use the ingestion API endpoint: `POST /api/ingest`
2. Send sample sensor data:

```json
{
  "temperature": 25.5,
  "humidity": 60,
  "pressure": 1013.25,
  "windSpeed": 10,
  "windDirection": 180
}
```

3. Verify data appears in Supabase Dashboard > Database > sensor_readings

## Step 8: Configure Row Level Security (RLS)

The migration includes basic RLS policies, but you may want to customize them:

1. Go to Database > sensor_readings table
2. Click on "RLS" to view/edit policies
3. Adjust policies based on your security requirements

## Step 9: Remove Old Dependencies (Optional)

After confirming everything works, you can remove:

- Prisma-related packages: `npm uninstall prisma @prisma/client`
- NextAuth if fully migrated: `npm uninstall next-auth`
- PostgreSQL drivers if no longer needed

## Step 10: Deploy to Production

1. Update production environment variables
2. Update OAuth redirect URLs in Google Console
3. Update Supabase authentication settings with production domain
4. Deploy your application

## Troubleshooting

### Common Issues:

1. **Authentication not working:**

   - Check Google OAuth credentials
   - Verify redirect URLs in both Google Console and Supabase
   - Ensure environment variables are loaded correctly

2. **Database connection errors:**

   - Verify Supabase URL and keys
   - Check if the database schema was created correctly
   - Ensure RLS policies allow your operations

3. **API ingestion failing:**
   - Check the new validation schema
   - Verify the sensor data model mapping
   - Review Supabase logs in Dashboard > Logs

### Useful Commands:

```bash
# Check TypeScript compilation
npm run type-check

# Run development server with detailed logging
npm run dev

# Test API endpoint
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"temperature": 25.5, "humidity": 60}'
```

## Migration Benefits

✅ **Simplified Architecture**: Single platform for auth + database
✅ **Real-time Capabilities**: Built-in real-time subscriptions
✅ **Automatic API Generation**: RESTful and GraphQL APIs
✅ **Built-in Security**: Row Level Security and Auth policies
✅ **Scalability**: Managed PostgreSQL with automatic backups
✅ **Developer Experience**: Intuitive dashboard and tooling

## Next Steps

After successful migration:

- Set up real-time subscriptions for live dashboard updates
- Configure automatic backups and point-in-time recovery
- Set up monitoring and alerting
- Optimize database indexes for your query patterns
- Implement data archival policies for old sensor readings

## Support

- Supabase Documentation: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- GitHub Issues: Create an issue in your repository for project-specific problems
