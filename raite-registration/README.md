# RAITE Registration Platform

A production-ready event registration platform for PSITE Region III.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Auth**: Clerk
- **Database**: Supabase (PostgreSQL) + Prisma ORM
- **Real-time**: Supabase Realtime
- **Email**: Resend + React Email
- **AI**: Google Gemini (Vercel AI SDK)
- **Rate Limiting**: Upstash Redis
- **Styling**: Tailwind CSS + shadcn/ui

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repo-url>
cd raite-registration
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:

```env
DATABASE_URL="postgresql://..."

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
CLERK_WEBHOOK_SECRET="whsec_..."

RESEND_API_KEY="re_..."

UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

GOOGLE_GENERATIVE_AI_API_KEY="..."

NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database Setup
```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server
```bash
npm run dev
```

## Features
- **4-Step Registration Wizard**: Select event, team info, upload requirements, and review.
- **Draft Persistence**: Progress is saved to `sessionStorage`.
- **Admin Dashboard**: Real-time updates, batch approvals/rejections, and analytics.
- **AI Chatbot**: Instant support for participants via Gemini.
- **Email Notifications**: Confirmation and status updates.

## Testing
```bash
npm test          # Run Jest tests
npx playwright test # Run Playwright tests
```

## Security
- Rate limiting on AI and form submissions via Upstash.
- Server Actions for all database mutations.
- Clerk for secure authentication.
- Input validation using Zod.
