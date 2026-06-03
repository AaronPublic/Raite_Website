RAITE Registration Platform – Complete System Design (Rebuild)
1. Overview
The RAITE Registration platform is a modern, bug‑free event registration system for PSITE Region III. It provides a 4‑step registration wizard for participants, a real‑time admin dashboard with batch operations, and an AI chatbot for instant FAQ support. The system handles team formation, requirement uploads, email confirmations, and admin approvals – no payment processing.

2. Technology Stack (All Free Tier)
Layer	Technology	Free Tier Limits
Framework	Next.js 15 (App Router)	Free & open source
Language	TypeScript	Free & open source
Styling	Tailwind CSS + shadcn/ui	Free & open source
Authentication	Clerk	50,000 monthly retained users
Database	Supabase (PostgreSQL)	500 MB, 50k MAU, 2M realtime messages
ORM	Prisma	Free & open source
Email	Resend + React Email	3,000 emails/month
AI Chatbot	Google Gemini + Vercel AI SDK	60 requests/minute (free)
Rate Limiting	Upstash Redis	10,000 commands/day, 256 MB
Real‑time	Supabase Realtime	Included in Supabase free tier
Hosting	Vercel	100 GB bandwidth, 1M function calls
CI/CD	GitHub Actions	2,000 min/month (private repos)
Testing	Jest, RTL, Playwright	Free & open source
Forms	react‑hook‑form + Zod	Free (MIT)
Charts	recharts	Free (MIT)
3. Architectural Patterns (Bug‑Prevention Focus)
Server‑First Data Fetching – Server Components load data; Client Components only for interactive parts.

Data Access Layer (DAL) – All Prisma queries live in src/lib/data/ (e.g., users.ts, registrations.ts).

Server Actions for Mutations – Every form submission calls a Server Action, no manual API routes.

Strict Server/Client Separation – 'use client' only for stateful components (wizard, chatbot, admin table).

Draft Persistence – Registration wizard auto‑saves progress to sessionStorage; refresh does not lose data.

Real‑time via Supabase Realtime – Instead of polling, admin dashboard and email verification react instantly.

Atomic Batch Operations – Admin bulk updates use Prisma $transaction to prevent partial failures.

Row‑Level Security (RLS) – Supabase RLS + Clerk JWT verification ensures users see only their own data.

4. Folder Structure
text
raite-registration/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/           # Clerk’s sign‑in, sign‑up, user profile
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── dashboard/
│   │   │       ├── registrations/
│   │   │       └── analytics/
│   │   ├── (participant)/
│   │   │   └── register/
│   │   │       ├── step-1/
│   │   │       ├── step-2/
│   │   │       ├── step-3/
│   │   │       └── step-4/
│   │   └── api/
│   │       ├── webhooks/
│   │       │   └── clerk/    # user.created / user.updated sync
│   │       └── ai/
│   │           └── chat/      # Gemini streaming (Vercel AI SDK)
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── admin/
│   │   ├── registration/
│   │   └── chatbot/
│   ├── lib/
│   │   ├── data/
│   │   │   ├── users.ts
│   │   │   ├── registrations.ts
│   │   │   └── events.ts
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── email.ts           # Resend client + helpers
│   │   └── redis.ts           # Upstash Redis client
│   ├── hooks/
│   ├── types/
│   └── utils/
├── middleware.ts              # Clerk middleware + rate limiting
├── next.config.ts
├── package.json
└── tailwind.config.js
5. Database Schema (Prisma – No Payments)
prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  role          Role      @default(PARTICIPANT)
  clerkId       String    @unique   // from Clerk
  school        String?
  course        String?
  yearLevel     String?

  registrations Registration[]
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}

model Event {
  id          String        @id @default(cuid())
  title       String
  description String?
  startDate   DateTime
  endDate     DateTime
  capacity    Int?
  status      EventStatus   @default(UPCOMING)

  registrations Registration[]
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
}

model Registration {
  id           String             @id @default(cuid())
  userId       String
  eventId      String
  status       RegistrationStatus @default(PENDING)
  teamName     String?
  members      Json?              // store team members as JSON
  requirements Json?              // file URLs or requirement flags

  user         User               @relation(fields: [userId], references: [id])
  event        Event              @relation(fields: [eventId], references: [id])
  createdAt    DateTime           @default(now())
  updatedAt    DateTime           @updatedAt

  @@unique([userId, eventId])
}

enum Role {
  PARTICIPANT
  ADMIN
}

enum EventStatus {
  UPCOMING
  ONGOING
  COMPLETED
  CANCELLED
}

enum RegistrationStatus {
  PENDING
  APPROVED
  REJECTED
  WAITLISTED
}
6. Authentication & Onboarding (Clerk)
Sign‑in / Sign‑up – Use Clerk’s pre‑built <SignInButton> and <SignUpButton>.

Webhook sync – On user.created, create a matching User record in Prisma.

Onboarding redirect – After first sign‑in, check if school, course, yearLevel are missing. If missing, redirect to /profile/complete.

Role management – Assign ADMIN role manually in Supabase dashboard or via a secure admin creation script.

Middleware – Use Clerk’s clerkMiddleware() to protect /admin and /register routes.

7. Registration Wizard (4 Steps, Draft Persistence)
Each step is a separate URL:

/register/step-1 – Select event from list of upcoming events.

/register/step-2 – Team info: individual or team name + member emails.

/register/step-3 – Upload requirements (files to Supabase Storage) + answer custom questions.

/register/step-4 – Review all data + final submit.

Draft persistence – Use sessionStorage (or a React context + useEffect) to save wizard state after each step. On page load, restore from storage.

Final submission – Call a Server Action that:

Validates all data with Zod.

Creates the Registration record inside a Prisma transaction.

Sends a confirmation email via Resend.

Clears the draft from sessionStorage.

8. Admin Dashboard (Real‑Time)
Protected route /admin/dashboard.

Supabase Realtime – Subscribe to registrations table changes; update dashboard stats live.

Registration table – Search, filter by event/status, sort by date.

Batch actions – Multi‑select rows, then approve/reject/waitlist using a Server Action that uses Prisma $transaction.

Analytics – recharts shows:

Registrations per day/week.

Registrations per school (bar chart).

Event popularity (pie chart).

Activity feed – Sidebar with latest 10 actions (new registrations, status changes) – also real‑time.

9. AI Chatbot (Gemini + Vercel AI SDK)
Frontend – Chatbot component with message list, input, and "quick chips" (e.g., "What are the rules?", "Deadline?").

Backend – API route /api/ai/chat that uses streamText from Vercel AI SDK + Google Gemini.

Prompt engineering – Include system prompt with event rules, deadlines, and contact info.

Rate limiting – Apply Upstash Redis rate limit (e.g., 5 requests per minute per user) to the API route.

10. Email System (Resend + React Email)
Templates – Write email components in src/emails/ (e.g., RegistrationConfirmation.tsx, AdminNotification.tsx).

Send helpers – sendRegistrationConfirmation(user, event) and sendAdminApprovalNotification(registration).

Trigger points:

After user submits registration → confirmation email to user.

After admin approves/rejects → notification email to user.

11. Security Checklist
Security Measure	Implementation
Environment validation	Zod schema in src/env.ts
Rate limiting	Upstash Redis (API routes + Server Actions)
RLS in Supabase	Enable Row Level Security; verify Clerk JWT in Prisma queries
Webhook verification	Clerk webhook signature verification
File uploads	Supabase Storage with RLS (user can only read/write own files)
Server Actions only	No direct database access from client
Input validation	Zod on every Server Action
12. Testing Strategy
Unit tests (Jest) – DAL functions, utility helpers, form validation logic.

Integration tests (React Testing Library) – Wizard step transitions, admin table interactions.

E2E tests (Playwright) – Full user journey: sign up → complete profile → register for event → admin approves.

13. Deployment (Vercel + GitHub Actions)
Vercel – Connect GitHub repo; automatic preview deploys on PR.

Environment variables – Set all in Vercel dashboard (Clerk, Supabase, Resend, Gemini, Upstash).

GitHub Actions – Run pnpm test and pnpm prisma migrate deploy before production deploy.