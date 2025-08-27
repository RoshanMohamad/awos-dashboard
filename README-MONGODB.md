MongoDB Backend Integration

What I added

- MongoDB connection helper: `lib/mongodb.ts`
- NextAuth MongoDB client helper: `lib/nextMongoClient.ts`
- Mongoose model: `models/sensorReading.ts`
- Ingest API: `app/api/ingest/route.ts` (POST batch or single JSON)
- Realtime SSE: `app/api/realtime/route.ts` (Server-Sent Events streaming inserts)
- NextAuth route wired to MongoDB adapter: `app/api/auth/[...nextauth]/route.ts`

Environment

- Create a `.env.local` with the following entries:

MONGODB_URI=mongodb://localhost:27017/awos
NEXTAUTH_SECRET=some_long_random_string
GITHUB_ID=your_github_oauth_client_id
GITHUB_SECRET=your_github_oauth_client_secret

Install

- Run locally:

```bash
npm install --legacy-peer-deps
npm run dev
```

Ingestion

- POST to `/api/ingest` with either a single reading JSON or an array of readings.

Realtime

- Connect to `/api/realtime` using SSE to receive real-time inserted readings.

Notes

- I added dependencies `mongodb`, `mongoose`, and `@next-auth/mongodb-adapter` to `package.json`.
- I could not run `npm install` to completion within this environment; please run `npm install --legacy-peer-deps` locally to fetch packages.

## Google OAuth setup

1. Go to Google Cloud Console -> APIs & Services -> Credentials.
2. Create an OAuth 2.0 Client ID (type: Web application).
3. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
4. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env.local`.

Restart the dev server after adding env vars.
