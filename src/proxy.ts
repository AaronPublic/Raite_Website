import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/contact(.*)",
  "/competitions(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
  "/api/ai/chat(.*)",
]);

const isProfileCompleteRoute = createRouteMatcher(["/profile/complete"]);

export default clerkMiddleware(async (auth, request) => {
  const { userId } = await auth();

  if (!userId && !isPublicRoute(request)) {
    await auth.protect();
  }

  // If logged in, check if onboarding is needed
  // Note: We can't easily query Prisma here due to middleware constraints in some environments,
  // but for this project we'll assume we can or we'll use a session claim if configured.
  // Alternatively, we can redirect on the layout level.
  // Let's do the redirect in the layout for better DB access and consistency with Next.js 15.
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};
