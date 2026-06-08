# Filer

Filer is a Next.js 15 Google Drive file manager. Users sign in with Google, grant Drive access, and manage files inside their own Google Drive. The app keeps user profiles, OAuth tokens, settings, and activity logs in Postgres through Prisma; uploaded files stay in Google Drive.

## Features

- Google OAuth with Auth.js
- App-specific Google Drive folder mode
- Upload, list, search, rename, move, download, share, delete, and create folders
- Material UI dashboard with responsive navigation
- PostgreSQL + Prisma models for users, OAuth accounts, sessions, settings, and activity logs
- Next.js route handlers for all Drive actions

## Environment

Create `.env.local` locally and add the same values in Vercel for production:

```env
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-a-long-random-secret"
AUTH_URL="http://localhost:3000"
AUTH_TRUST_HOST="true"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

For production, set `AUTH_URL` to the Vercel production URL. Add these Google OAuth redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://your-vercel-domain.vercel.app/api/auth/callback/google
```

## Database

Apply the Prisma migration to the production Postgres database:

```bash
npx prisma migrate deploy
```

For local development:

```bash
npm install
npx prisma generate
npm run dev
```

## Checks

```bash
npm run lint
npm run build
```
