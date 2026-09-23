# Judging & Scoring System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a comprehensive Judging and Scoring system for RAITE 2026 with a new `JUDGE` role, competition-specific rubrics, admin judge management with direct Clerk credential creation, admin social media score inputs, and live leaderboard rankings.

**Architecture:** 
- `Prisma` models (`JudgeAssignment`, `Score`, `Role.JUDGE`, `Registration.socialMediaScore`) stored in Supabase PostgreSQL.
- Server Actions for secure data retrieval and mutations (`src/app/actions/judging.ts`, `src/app/actions/admin-scoring.ts`).
- Admin UI at `/admin/judges` and `/admin/scores`.
- Judge Evaluation Portal at `/judge/competitions` and `/judge/competitions/[id]/evaluate/[registrationId]`.
- Frontend built with Next.js Turbopack, Tailwind CSS, Lucide React icons, and Shadcn UI components.

**Tech Stack:** Next.js 16 (App Router), Prisma ORM, Clerk Authentication, Tailwind CSS, Shadcn UI, Lucide Icons, Sonner toasts.

## Global Constraints
- **NO GIT COMMANDS**: Do not run any `git` shell commands.
- **Documentation & Code Integrity**: Preserve all existing participant, coach, billing, registration, and report features without disruption.
- **Component Styling**: Use Tailwind CSS, Lucide React, and Shadcn UI primitives matching the RAITE 2026 theme.

---

### Task 1: Prisma Schema & Database Updates

**Files:**
- Modify: `prisma/schema.prisma`

**Interfaces:**
- Add `JUDGE` to `enum Role`.
- Add `model JudgeAssignment`.
- Add `model Score`.
- Add `socialMediaScore Float? @default(0)` to `model Registration`.
- Add reverse relations to `User` and `Event`.

- [ ] **Step 1: Update `prisma/schema.prisma`**
- [ ] **Step 2: Push database schema using `npx prisma db push`**
- [ ] **Step 3: Generate Prisma Client using `npx prisma generate`**

---

### Task 2: Rubrics Configuration & Calculation Helpers

**Files:**
- Create: `src/lib/rubrics.ts`

**Interfaces:**
- Produces:
  - `COMPETITION_RUBRICS`: Object containing rubric criteria, max scores, and social media labels for all 4 online events.
  - `calculateTotalScore(criteriaScores: Record<string, number>): number`
  - `calculateRegistrationRanking(registrations: any[]): ComputedRankEntry[]`

- [ ] **Step 1: Create `src/lib/rubrics.ts` with criteria definitions for Lanyard, Micro Short Film, TechTok, and Infographics.**
- [ ] **Step 2: Add pure calculation helper functions with boundary validation.**

---

### Task 3: Server Actions for Judging & Admin Scoring

**Files:**
- Create: `src/app/actions/judging.ts`
- Create: `src/app/actions/admin-scoring.ts`

**Interfaces:**
- `src/app/actions/judging.ts`:
  - `getJudgeCompetitions(): Promise<Event[]>`
  - `getJudgeCompetitionSubmissions(eventId: string): Promise<RegistrationWithScores[]>`
  - `getSubmissionForEvaluation(registrationId: string): Promise<RegistrationDetail>`
  - `submitJudgeScore(data: { registrationId: string; criteriaScores: Record<string, number>; feedback?: string }): Promise<{ success: boolean; error?: string }>`
- `src/app/actions/admin-scoring.ts`:
  - `getJudges(): Promise<UserWithAssignments[]>`
  - `createJudge(data: { name: string; email: string; password: string; eventIds: string[] }): Promise<{ success: boolean; error?: string }>`
  - `updateJudge(data: { judgeId: string; name?: string; password?: string; eventIds: string[] }): Promise<{ success: boolean; error?: string }>`
  - `deleteJudge(judgeId: string): Promise<{ success: boolean; error?: string }>`
  - `getCompetitionLeaderboard(eventId: string): Promise<LeaderboardData>`
  - `updateSocialMediaScore(registrationId: string, score: number): Promise<{ success: boolean; error?: string }>`

- [ ] **Step 1: Implement `src/app/actions/judging.ts` with role and assignment authorization.**
- [ ] **Step 2: Implement `src/app/actions/admin-scoring.ts` with Clerk user creation/management and leaderboard data queries.**

---

### Task 4: Admin Judges Management UI (`/admin/judges`)

**Files:**
- Create: `src/app/admin/judges/page.tsx`
- Create: `src/components/admin/JudgesManagement.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`

- [ ] **Step 1: Build `JudgesManagement.tsx` component with Add/Edit Judge dialogs, competition assignment badges, and password reset capability.**
- [ ] **Step 2: Build `src/app/admin/judges/page.tsx` server component to fetch judges and competition lists.**
- [ ] **Step 3: Update `AdminSidebar.tsx` to add "Judges" (`/admin/judges`) and "Scores & Rankings" (`/admin/scores`) navigation links.**

---

### Task 5: Admin Scores & Live Leaderboard UI (`/admin/scores`)

**Files:**
- Create: `src/app/admin/scores/page.tsx`
- Create: `src/components/admin/AdminScoringClient.tsx`

- [ ] **Step 1: Build `AdminScoringClient.tsx` featuring:**
  - Competition tabs (Lanyard, Micro Short Film, TechTok, Infographics).
  - Leaderboard table with rank badges, school name, team/competitor, judge breakdown columns, average score (/95), inline editable social media input (/5), and final score (/100).
  - Individual judge scores modal/popover.
  - CSV Export button.
- [ ] **Step 2: Build `src/app/admin/scores/page.tsx` server component.**

---

### Task 6: Judge Evaluation Portal UI (`/judge/...`)

**Files:**
- Create: `src/app/judge/layout.tsx`
- Create: `src/app/judge/competitions/page.tsx`
- Create: `src/app/judge/competitions/[id]/page.tsx`
- Create: `src/app/judge/competitions/[id]/evaluate/[registrationId]/page.tsx`
- Create: `src/components/judge/RubricEvaluationForm.tsx`
- Modify: `src/components/NavbarActions.tsx`

- [ ] **Step 1: Create `src/app/judge/layout.tsx` with `Role.JUDGE` and `Role.ADMIN` session validation and sidebar/header.**
- [ ] **Step 2: Create `src/app/judge/competitions/page.tsx` displaying assigned competition cards with progress badges.**
- [ ] **Step 3: Create `src/app/judge/competitions/[id]/page.tsx` showing the submissions list with evaluated/pending statuses.**
- [ ] **Step 4: Create `RubricEvaluationForm.tsx` with submission preview, slider/number inputs for each criterion, live total score calculator, feedback textarea, and confirmation modal before locking in scores.**
- [ ] **Step 5: Create `[registrationId]/page.tsx` page connecting the evaluation form.**
- [ ] **Step 6: Update `NavbarActions.tsx` to show the "Judging Portal" button for users with `Role.JUDGE`.**

---

### Task 7: Compilation, Verification & Validation

**Files:**
- Test with `npx tsc --noEmit`
- Run verification script to test Judge creation, assignment, scoring, and leaderboard computations.

- [ ] **Step 1: Run `npx tsc --noEmit` and fix any TypeScript compiler errors.**
- [ ] **Step 2: Test end-to-end workflow (Admin creates Judge -> Judge evaluates -> Admin inputs social media score -> Leaderboard shows calculated ranks).**
