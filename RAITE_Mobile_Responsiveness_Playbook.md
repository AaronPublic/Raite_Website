# RAITE Website – Mobile Responsiveness & Interactive Performance Playbook

This playbook provides a technical roadmap for transforming the RAITE Registration platform into a high-performance, "Mobile-Primary" experience. These optimizations adhere strictly to the **"No UI/UX Changes"** mandate, focusing exclusively on responsiveness, touch interaction, and mobile-specific performance.

---

## 🚀 Executive Summary (Top 5 ROI)

1.  **Fluid Typography & Spacing**: Implement `clamp()` for all text and spacing to eliminate "janky" breakpoints. **Impact**: Consistent readability across all device sizes.
2.  **Adaptive Image Delivery**: Add the `sizes` attribute to all `next/image` components. **Impact**: Reduces mobile data usage by up to 70% by serving correctly-sized assets.
3.  **Touch Target Standard (44x44px)**: Enforce a minimum hit area for all interactive elements. **Impact**: Meets WCAG 2.2 Level AAA standards and drastically reduces user frustration.
4.  **Next.js 16 PPR & Edge Delivery**: Leverage the already-implemented Partial Prerendering and Wasm engine for Edge-ready mobile delivery. **Impact**: Instant Time-to-First-Byte (TTFB) even on 3G/4G networks.
5.  **PWA Core Implementation**: Deploy `@serwist/next` for offline capabilities and "Add to Home Screen" support. **Impact**: Native-app feel and increased student engagement.

---

## Section A: Responsive Layout Architecture (No UI Changes)

### 1. Progressive Enhancement (Mobile-First)
Convert current CSS/Tailwind patterns to use `min-width` as the primary scaling mechanism.
- **Strategy**: Base styles are mobile (stacked); complexity is added via `sm:`, `md:`, `lg:` prefixes.
- **Constraint**: No fixed `px` widths for containers; use `max-width: min(90vw, 1200px)`.

### 2. Fluid Typography with `clamp()`
Replace static `text-lg` or `text-2xl` with fluid units.
- **Formula**: `font-size: clamp(min, preferred, max)`
- **Standard Scale**:
  - `Hero Title`: `clamp(2.5rem, 8vw + 1rem, 6rem)`
  - `Body Text`: `clamp(1rem, 0.5vw + 0.9rem, 1.125rem)`
- **Location**: Defined as CSS variables in `src/app/globals.css`.

---

## Section B: Touch & Gesture Optimization

### 1. WCAG 2.2 Touch Targets
Ensure all buttons and links are easily tappable.
- **Requirement**: Minimum `44x44px` hit area (Level AAA) for primary actions.
- **Implementation**: 
  ```css
  /* Established in globals.css */
  button, a, [role="button"] {
    min-width: 44px;
    min-height: 44px;
  }
  ```

### 2. Eliminate Tap Delay & Prevent Zoom
- **Action**: Correct `viewport` config in `src/app/layout.tsx`.
- **Code**:
  ```typescript
  export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
  };
  ```
- **iOS Fix**: Established `font-size: 16px` on all inputs in `globals.css`.

### 3. Visual Touch Feedback
- **Action**: Added `whileTap={{ scale: 0.98 }}` to `CompetitionCard.tsx` and interactive motion elements.

---

## Section C: Mobile Performance (Core Web Vitals)

### 1. LCP (Largest Contentful Paint) Optimization
- **Action**: Hero image in `src/app/page.tsx` configured with `priority={true}` and `sizes="100vw"`.

### 2. INP (Interaction to Next Paint) Reduction
- **Strategy**: Break up long tasks. Heavy components (Chatbot, Analytics) isolated behind `<Suspense>`.

---

## Section D: Mobile Network & Data Optimization

### 1. Smart Prefetching
- **Action**: Use `<Link prefetch={false}>` for low-priority navigational elements to save student data.

### 2. Responsive Image `sizes`
- **Standard**: `sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"`
- **Verified Files**: `src/app/page.tsx`, `src/components/competitions/CompetitionCard.tsx`, `src/components/Navbar.tsx`.

---

## Section E: Progressive Web App (PWA)

### 1. manifest.ts implementation
Next.js 15+ allows for a dynamic `manifest.ts` file instead of a static JSON.
- **File**: `src/app/manifest.ts`
- **Theme Color**: #0038A8 (RAITE Blue)

### 2. Service Worker with `@serwist/next`
- **Library**: `@serwist/next` + `serwist`
- **Configuration**: Wrapped in `next.config.ts` using `withSerwistInit`.
- **Source**: `src/app/sw.ts` implementing `defaultCache`.

---

## Section F: Implementation Roadmap

| Priority | Task | Impact | Complexity |
| :--- | :--- | :--- | :--- |
| **P0** | iOS Input Zoom Fix (16px) | High | Very Low |
| **P0** | Image `sizes` Optimization | Very High | Low |
| **P1** | Fluid Typography (`clamp`) | Medium | Medium |
| **P1** | Touch Target Standard (44px) | High | Medium |
| **P2** | PWA Offline Capability | Medium | High |

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

## Appendix: Required Libraries & Commands

```bash
# Interactivity
npm install framer-motion swiper react-use

# PWA
npm install @serwist/next serwist
```
