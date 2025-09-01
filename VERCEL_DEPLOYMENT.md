# Vercel Deployment Guide for AWOS Dashboard

This guide will help you deploy your AWOS Dashboard to Vercel without using DevOps pipelines.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Your code should be pushed to GitHub (which it already is)
3. **Supabase Project**: You'll need a Supabase project for the database

## Step 1: Prepare Your Repository

✅ **Already Done**: Your Next.js configuration has been updated for Vercel deployment.
✅ **Already Done**: `vercel.json` configuration file has been created.
✅ **Already Done**: Environment variables example has been updated.

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. **Connect GitHub Repository**:

   - Go to [vercel.com](https://vercel.com) and sign in
   - Click "New Project"
   - Import your GitHub repository: `RoshanMohamad/awos-dashboard`

2. **Configure Project Settings**:

   - **Framework Preset**: Next.js (should be auto-detected)
   - **Root Directory**: `./` (leave as default)
   - **Build Command**: `npm run build` (should be auto-detected)
   - **Output Directory**: `.next` (should be auto-detected)

3. **Set Environment Variables**:
   Add these environment variables in the Vercel dashboard:

   ```
   NEXT_PUBLIC_SUPABASE_URL=your_actual_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_actual_supabase_anon_key
   ```

4. **Deploy**: Click "Deploy" and wait for the build to complete.

### Option B: Deploy via Vercel CLI

1. **Install Vercel CLI**:

   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:

   ```bash
   vercel login
   ```

3. **Deploy from your project directory**:

   ```bash
   vercel
   ```

4. **Set environment variables**:
   ```bash
   vercel env add NEXT_PUBLIC_SUPABASE_URL
   vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

## Step 3: Configure Supabase

1. **Create a Supabase Project** (if you haven't already):

   - Go to [supabase.com](https://supabase.com)
   - Create a new project

2. **Get Your Credentials**:

   - Go to Project Settings → API
   - Copy the `Project URL` and `anon/public key`

3. **Update Environment Variables in Vercel**:
   - Go to your Vercel project dashboard
   - Navigate to Settings → Environment Variables
   - Add your Supabase credentials

## Step 4: Configure Your Domain (Optional)

1. **Add Custom Domain** (if desired):

   - In Vercel dashboard, go to Settings → Domains
   - Add your custom domain

2. **Update Environment Variables**:
   - Update `NEXT_PUBLIC_BASE_URL` to your actual domain

## Step 5: Set Up Database Schema

If you're using Supabase, you'll need to set up your database schema:

1. **Go to Supabase SQL Editor**
2. **Run your migration scripts** (if you have any in the `sql/` folder)
3. **Set up your tables** according to your application needs

## Automatic Deployments

Once connected to GitHub, Vercel will automatically:

- Deploy when you push to the main branch
- Create preview deployments for pull requests
- Provide deployment URLs for each deployment

## Environment Variables Needed

Make sure these are set in your Vercel project:

| Variable                        | Description                                      | Required |
| ------------------------------- | ------------------------------------------------ | -------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Your Supabase project URL                        | Yes      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anonymous key                      | Yes      |
| `SUPABASE_SERVICE_ROLE_KEY`     | Service role key (if using server-side features) | Optional |
| `NEXT_PUBLIC_BASE_URL`          | Your app's base URL                              | Optional |

## Troubleshooting

### Build Errors

- Check the build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify environment variables are set correctly

### Runtime Errors

- Check function logs in Vercel dashboard
- Verify Supabase connection and credentials
- Check that your database schema matches your application

### PWA Features

- Service worker is configured to work with Vercel
- Manifest.json is properly served
- Icons should be in the `public/icons/` directory

## Monitoring

- **Analytics**: Available in Vercel dashboard
- **Logs**: Function logs available in real-time
- **Performance**: Web Vitals tracking included

Your AWOS Dashboard is now ready for Vercel deployment! 🚀
