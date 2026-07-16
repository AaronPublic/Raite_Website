# RAITE Registration Platform

A production-ready event registration platform for PSITE Region III (RAITE 2026).

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL) + Prisma ORM + `@prisma/adapter-pg` driver adapter
- **Database Pooling**: PgBouncer transaction pooler configured on port `6543`
- **Real-time**: Supabase Realtime
- **Email**: Brevo API & Resend API + React Email
- **AI Integration**: Google Gemini (Vercel AI SDK)
- **Rate Limiting**: Upstash Redis
- **File Storage**: Google Drive API (OAuth2 flow) for large competitors' media entries
- **PWA Service Worker**: Serwist
- **Styling**: Tailwind CSS + shadcn/ui

## Production Deployment Environment
- **Server**: Namecheap VPS (Ubuntu 24.04 LTS)
- **Web Server / Proxy**: Nginx (Reverse proxying traffic to `http://localhost:3000`)
- **Process Manager**: PM2 (Daemonized process runner with `NODE_OPTIONS="--max-old-space-size=4096"`)
- **SSL/TLS**: Let's Encrypt SSL via Certbot (Automatic redirection enabled)
- **Max Upload Limit**: Configured up to **1.2GB** (`1200M`) in Nginx and Next.js (`proxyClientMaxBodySize` / `bodySizeLimit`) with 15-minute connection timeouts.
- **DNS Configuration**: Proxied via Cloudflare (Recommended: "DNS Only" / Grey Cloud during submission phase to allow uploads >100MB, toggle back to "Proxied" / Orange Cloud for DDoS protection on live days).

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd raite-registration
```

### 2. Install dependencies
```bash
yarn install # or npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://...:5432/postgres"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

RESEND_API_KEY="re_..."
BREVO_API_KEY="xkeysib-..."

UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

GOOGLE_GENERATIVE_AI_API_KEY="..."

GOOGLE_DRIVE_FOLDER_ID="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
GOOGLE_REFRESH_TOKEN="..."

NEXT_PUBLIC_APP_URL="https://psitecl.org"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server
```bash
yarn dev # or npm run dev
```

## Useful Operations & Admin Scripts

### 1. Emergency Database Cleanup (Post-Testing)
To wipe all mock registrations and participant user data before opening the live registration (while keeping all Admin, Sub-Admin, and Faculty Coach accounts intact), run the following on your VPS:
```bash
npx tsx scripts/clean-test-data.ts
```

### 2. Update Coach School Assignment
To update a Faculty Coach's school and automatically migrate all their registered student competitors to the new school (regenerating their unique ID prefixes), run:
```bash
npx tsx scripts/update-coach-school.ts <coach-email> "<new-school-name-or-abbreviation>" --update-students
```

## Optimizations
* **PgBouncer Pooling**: Configured on port `6543` to throttle concurrent database operations under heavy coach registration spikes.
* **Interactive Transaction Timeout**: Increased transaction timeouts in Prisma to 30 seconds (`{ timeout: 30000 }`) to prevent expiration errors during bulk Excel/CSV competitor imports.
* **Bypassed Middleware Cloning**: Google Drive media uploads are routed via a custom API Route Handler (`/api/upload/entry`) and excluded from Clerk's middleware matcher to prevent memory overflow and connection resets during 100MB+ video transfers.
* **Enhanced Memory limit**: Node process allocated 4GB heap size under PM2 to prevent Out-Of-Memory errors during compilation.
