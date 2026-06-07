# RAITE Website – Optimization Playbook

This playbook provides a technical roadmap for significantly improving the performance and storage efficiency of the RAITE Registration platform. These optimizations adhere strictly to the **"No UI/UX Changes"** mandate, focusing exclusively on architectural, configuration, and data-layer improvements.

---

## 🚀 Executive Summary (High ROI)

1.  **Prisma 7.8 Engine Migration**: Switch to the Rust-free Wasm client. **Impact**: Reduces client bundle size by ~12.5MB (90% reduction).
2.  **Supabase Storage & Compression**: Move from local filesystem to Supabase Storage with client-side compression. **Impact**: Reduces image storage usage by ~80% and unblocks serverless deployments.
3.  **Partial Prerendering (PPR)**: Enabled via Next.js 16 `cacheComponents` flag. **Impact**: Serving static shells instantly from the edge reduces TTFB to <100ms.

---

## Section A: Image & Asset Storage (No UI Changes)

Currently, files are uploaded to `public/uploads`, which increases repository size and isn't scalable.

### 1. Client-Side Pre-Compression
Implement `browser-image-compression` to shrink images *before* they leave the user's browser.
- **File**: `src/app/actions/upload.ts` (To be created/modified from current API routes)
- **Action**: Intercept the file in the Server Action or Client Component.
- **Library**: `npm install browser-image-compression`
- **Code**:
  ```typescript
  import compress from 'browser-image-compression';
  const options = { maxSizeMB: 0.5, maxWidthOrHeight: 1920 };
  const compressedFile = await compress(file, options);
  ```

### 2. Supabase Storage Migration
Redirect all uploads to Supabase buckets instead of the local filesystem.
- **Impact**: Zero server storage pressure; global CDN delivery.
- **Change**: Update `src/app/api/upload/competition-card/route.ts` and `rules/route.ts` to use `supabase.storage.from('bucket').upload()`.

### 3. Automatic WebP/AVIF Conversion
Use a custom Next.js image loader to leverage Supabase's transformation API.
- **File**: `src/lib/supabase-image-loader.ts`
- **Code**:
  ```typescript
  export default function supabaseLoader({ src, width, quality }) {
    return `https://${PROJECT_ID}.supabase.co/storage/v1/render/image/public/${src}?width=${width}&quality=${quality || 75}&format=webp`;
  }
  ```

---

## Section B: Bundle Size & Dependencies

### 1. Rust-Free Prisma Client
Upgrade to the modern Prisma architecture to shed massive binary overhead.
- **File**: `prisma/schema.prisma`
- **Action**: Change `engineType = "library"` to `engineType = "wasm"` (Requires Prisma 7.x).
- **Impact**: Drastic reduction in Vercel/Serverless deployment size.

### 2. Admin Feature Code Splitting
Prevent heavy libraries like `recharts` from loading for non-admin users.
- **File**: `src/app/admin/dashboard/page.tsx`
- **Action**: Use `next/dynamic` for `AnalyticsCharts`.
  ```typescript
  const AnalyticsCharts = dynamic(() => import('@/components/admin/AnalyticsCharts'), { 
    ssr: false,
    loading: () => <Skeleton className="h-[300px]" />
  });
  ```

---

## Section C: Database & Query Performance

### 1. Fix N+1 Query in `submitRegistration`
The current `submitRegistration` action fetches *all* registrations in a loop to check participant limits.
- **File**: `src/app/actions/registration.ts`
- **Current**: `const allRegistrations = await tx.registration.findMany(...)` inside a `for` loop.
- **Fix**: Perform a single `findMany` with an `IN` clause for all member emails *before* the loop.
  ```typescript
  const existingMemberRegs = await tx.registration.findMany({
    where: { 
      members: { path: '$', array_contains: members },
      status: { not: 'REJECTED' }
    }
  });
  ```

### 2. Strategic Indexing
Add indexes to high-traffic foreign keys.
- **File**: `prisma/schema.prisma`
- **Action**: Add `@@index([eventId])` and `@@index([userId])` to the `Registration` model.

---

## Section D: Caching (Upstash Redis)

### 1. Global System Settings Caching
Cache `SystemSetting` values to avoid DB hits on every page load (e.g., Countdown timer).
- **File**: `src/lib/data/settings.ts`
- **TTL**: 1 Hour.
- **Strategy**: Cache-Aside (Check Redis -> Fetch DB -> Update Redis).

### 2. Public Statistics Caching
Cache counts for "Total Participants" and "Registered Schools" displayed on the homepage.
- **Invalidation**: Use `revalidateTag` in `submitRegistration` to purge the cache when a new team joins.

---

## Section E: Next.js 16 Rendering & Caching

### 1. Modern Partial Prerendering (PPR)
Next.js 16 simplifies PPR. It is now enabled via the top-level `cacheComponents` flag in `next.config.ts`.
- **File**: `next.config.ts`
- **Config**:
  ```typescript
  const nextConfig = {
    cacheComponents: true
  };
  ```

### 2. Granular Suspense Boundaries
To resolve "Blocking Route" errors, move dynamic logic (auth, user-specific DB queries) into dedicated sub-components wrapped in `<Suspense>`.
- **Example**: Split a Hero section into `HeroContent` (Static) and `HeroActions` (Dynamic/Suspense).

### 3. The "use cache" Directive
Explicitly mark data fetchers as safe for the static shell to improve prerendering efficiency.
- **Usage**: Add `"use cache";` at the top of functions fetching announcements, settings, or leaderboard data.

---

## Section F: Error Troubleshooting

| Error | Cause | Solution |
| :--- | :--- | :--- |
| **Blocking Route** | Dynamic access outside `<Suspense>` | Move dynamic calls deeper and wrap in `<Suspense>`. |
| **PPR Random Client** | `Math.random()` in layout | Wrap the offending Client Component in `<Suspense>`. |
| **asChild Error** | Prop passed to DOM element | Implement `Slot` in `Button.tsx` and `DropdownMenu.tsx` for proper Radix composition. |
| **Redis Null Access** | Missing Credentials | Add null checks for the Redis client to fall back to the DB. |
| **Package Parse Error**| Corrupted `package.json` | Re-install the package: `npm install @upstash/ratelimit`. |
| **Image Positioning** | "static" parent warning | Use explicit inline `style={{ position: 'relative' }}` on parent. |

---

## Section H: Next.js 16 Environment (Turbopack)

### 1. Turbopack CSS Resolution
Tailwind v4 in Turbopack may fail to resolve complex `@import` statements for packages that aren't pure CSS (e.g., `tw-animate-css`).
- **Fix**: Consolidate core imports to `@import "tailwindcss";` and `@import "@clerk/ui/themes/shadcn.css";`. Remove legacy `shadcn/tailwind.css` imports.

### 2. Config Schema Cleanup
Next.js 16.2.7+ has internal optimizations that make explicit `turbo` experimental keys and `optimizePackageImports` unnecessary or invalid in some configurations.
- **Fix**: Stick to stable keys like `cacheComponents: true` and `serverExternalPackages`. Ensure `turbopack.root` is absolute using `process.cwd()`.

### 3. Middleware to Proxy Migration
The `middleware.ts` convention is officially deprecated. Rename the file to `proxy.ts` to ensure compatibility with the Next.js 16 proxy layer.

---

## Appendix: Required Commands

```bash
# Update Prisma & Dependencies
npm install prisma@latest @prisma/client@latest @prisma/adapter-pg
npm install browser-image-compression @upstash/redis @upstash/ratelimit

# Analysis
npm install -D @next/bundle-analyzer
```
