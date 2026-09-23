# Design Document: RAITE 2026 Judging & Scoring System

**Date:** 2026-09-23  
**Status:** Approved  
**Author:** AI Assistant & System Architect  

---

## 1. Executive Summary

This document specifies the technical design for the **Judging and Scoring System** for RAITE 2026. The feature introduces a dedicated `JUDGE` role, dynamic multi-judge evaluation with strict competition-specific rubrics, administrator social media scoring inputs, and real-time automated leaderboard and ranking calculations.

---

## 2. Architecture & Roles

```
┌────────────────────────────────────────────────────────────────────────┐
│                               CLERK AUTH                               │
│                   Role: ADMIN | SUB_ADMIN | JUDGE                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌─────────────────────────────┐           ┌─────────────────────────────┐
│      ADMIN DASHBOARD        │           │        JUDGE PORTAL         │
│ • /admin/judges             │           │ • /judge/competitions       │
│ • /admin/scores             │           │ • /judge/evaluate/[regId]   │
│ • Social Media Scores (/5)  │           │ • Rubric Evaluation (/95)   │
│ • Live Leaderboard Rankings │           │ • Confirmation Modal & Edit │
└──────────────┬──────────────┘           └──────────────┬──────────────┘
               │                                         │
               └────────────────────┬────────────────────┘
                                    ▼
                     ┌─────────────────────────────┐
                     │     DATABASE (POSTGRES)     │
                     │ • User (Role: JUDGE)        │
                     │ • JudgeAssignment           │
                     │ • Score                     │
                     │ • Registration              │
                     └─────────────────────────────┘
```

### Roles:
- **`ADMIN`**: Can create and manage judges, assign competitions to judges, edit judge credentials, input Social Media scores (out of 5), and view live calculated rankings.
- **`JUDGE`**: Can view assigned competitions, inspect submitted entries, evaluate submissions against criteria rubrics (out of 95), lock in scores with confirmation, and update scores if needed.

---

## 3. Database Schema Changes (`prisma/schema.prisma`)

### 3.1 Role Enum
```prisma
enum Role {
  PARTICIPANT
  ADMIN
  SUB_ADMIN
  FACULTY_COACH
  JUDGE
}
```

### 3.2 Models

```prisma
model JudgeAssignment {
  id        String   @id @default(cuid())
  judgeId   String
  eventId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  judge     User     @relation(fields: [judgeId], references: [id], onDelete: Cascade)
  event     Event    @relation(fields: [eventId], references: [id], onDelete: Cascade)

  @@unique([judgeId, eventId])
  @@index([judgeId])
  @@index([eventId])
}

model Score {
  id              String       @id @default(cuid())
  registrationId  String
  judgeId         String
  criteriaScores  Json         // Key-value pairs of criteria name -> points awarded
  totalScore      Float        // Sum of criteria scores (out of 95)
  feedback        String?      // Optional judge comments/critique
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  registration    Registration @relation(fields: [registrationId], references: [id], onDelete: Cascade)
  judge           User         @relation(fields: [judgeId], references: [id], onDelete: Cascade)

  @@unique([registrationId, judgeId])
  @@index([registrationId])
  @@index([judgeId])
}
```

### 3.3 Registration Model Updates
Add `socialMediaScore`:
```prisma
model Registration {
  // ... existing fields ...
  socialMediaScore     Float?             @default(0)
  scores               Score[]
  // ... existing relations ...
}
```

### 3.4 User & Event Model Updates
- In `User`: add `judgeAssignments JudgeAssignment[]` and `scoresGiven Score[]`.
- In `Event`: add `judgeAssignments JudgeAssignment[]`.

---

## 4. Competition Rubrics & Scoring Formulas

### 4.1 Competition Criteria Definition

```typescript
export interface RubricCriterion {
  id: string;
  name: string;
  maxScore: number;
  description?: string;
}

export const COMPETITION_RUBRICS: Record<string, { criteria: RubricCriterion[]; socialMediaLabel: string }> = {
  // 1. Lanyard Layout Design
  "Lanyard Layout Design": {
    socialMediaLabel: "Facebook Likes & Reactions",
    criteria: [
      { id: "relevance", name: "Concept / Relevance", maxScore: 35 },
      { id: "originality", name: "Originality", maxScore: 30 },
      { id: "creativity", name: "Creativity and Impact", maxScore: 30 },
    ],
  },
  // 2. Micro Short Film
  "Micro Short Film": {
    socialMediaLabel: "YouTube Like Voting",
    criteria: [
      { id: "creativity", name: "Creativity and Originality", maxScore: 25 },
      { id: "storytelling", name: "Storytelling", maxScore: 25 },
      { id: "quality", name: "Visual and Audio Quality", maxScore: 25 },
      { id: "technical", name: "Technical Execution", maxScore: 20 },
    ],
  },
  // 3. TechTok Challenge: CTRL+ NEXT Edition
  "TechTok Challenge: CTRL+ NEXT Edition": {
    socialMediaLabel: "Facebook Likes & Reactions",
    criteria: [
      { id: "relevance", name: "Relevance to Theme", maxScore: 20 },
      { id: "creativity", name: "Creativity and Originality", maxScore: 25 },
      { id: "visual", name: "Visual Impact and Aesthetics", maxScore: 25 },
      { id: "accuracy", name: "Content Accuracy and Organization", maxScore: 15 },
      { id: "technical", name: "Technical Execution and Design Quality", maxScore: 10 },
    ],
  },
  // 4. Infographics Design Competition
  "Infographics Design Competition": {
    socialMediaLabel: "Facebook Likes & Reactions",
    criteria: [
      { id: "relevance", name: "Relevance to Theme", maxScore: 25 },
      { id: "creativity", name: "Creativity and Originality", maxScore: 25 },
      { id: "visual", name: "Visual Impact and Aesthetics", maxScore: 20 },
      { id: "accuracy", name: "Content Accuracy and Organization", maxScore: 15 },
      { id: "technical", name: "Technical Execution and Design Quality", maxScore: 10 },
    ],
  },
};
```

### 4.2 Mathematical Calculation

For a registration $R$ evaluated by $N$ judges ($N \ge 1$):
$$\text{Judge Average} = \frac{\sum_{i=1}^N \text{Score}_i}{N} \quad (\text{Max: 95.00})$$
$$\text{Final Score} = \text{Judge Average} + \text{Social Media Score} \quad (\text{Max: 100.00})$$

---

## 5. User Interface & Pages

### 5.1 Admin Pages
- **`/admin/judges`**:
  - Table of all judges with name, email, assigned competitions, and creation date.
  - "Add Judge" modal with Clerk user creation (Name, Email, Password, Competition multi-select).
  - "Edit Judge" modal to change assigned competitions or reset password.
  - "Delete Judge" action with confirmation.
- **`/admin/scores`**:
  - Filter tabs by competition (Micro Short Film, Lanyard, TechTok, Infographics).
  - Leaderboard Table:
    - Rank (1st, 2nd, 3rd with podium badges)
    - School Name & Team/Competitor Name
    - Submission link (modal / preview)
    - Breakdown columns for each assigned judge (Judge 1, Judge 2, etc.)
    - Calculated Judge Average (out of 95)
    - Editable input for Admin Social Media Score (out of 5)
    - Final Computed Score (out of 100)
  - "Export Report" (PDF / CSV) for official tabulation.

### 5.2 Judge Pages
- **`/judge/competitions`**:
  - Grid cards of assigned competitions with total entries and evaluation progress (e.g. 5/8 evaluated).
- **`/judge/competitions/[id]/evaluate`**:
  - List of all submitted registrations for that competition.
  - Quick status badge: `Evaluated (Score: 88/95)` vs `Pending Evaluation`.
- **`/judge/competitions/[id]/evaluate/[registrationId]`**:
  - Clean split screen:
    - **Left / Top**: Submission preview (Google Drive embedded viewer, video/image preview, direct link).
    - **Right / Bottom**: Rubric scoring card with slider/input per criterion, total calculator, feedback textarea, and "Lock In Scores" button with AlertDialog confirmation.

---

## 6. Security & Authorization

- Route protection in layout (`/judge/layout.tsx` checks `user.role === "JUDGE"` or `"ADMIN"`).
- Server Actions authenticate with `auth()` and verify that:
  - Admin actions only run for `Role.ADMIN`.
  - Judge actions only allow evaluating registrations for events the judge is assigned to.
- Password updates in Clerk use `clerkClient().users.updateUser()`.

---

## 7. Quality & Integrity Guarantees

- **No existing code breakage**: All existing participant, coach, billing, shirt size, and registration tables and actions remain untouched.
- **Component Styling**: Styled using Tailwind CSS, Lucide React icons, and Shadcn UI components.
