import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { ratelimit } from "@/lib/redis";
import { headers } from "next/headers";

export async function POST(req: Request) {
  // Rate limiting
  const ip = (await headers()).get("x-forwarded-for") || "anonymous";
  
  if (ratelimit) {
    const { success, limit, reset, remaining } = await ratelimit.limit(ip);

    if (!success) {
      return new Response("Too many requests", {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
        },
      });
    }
  }

  const { messages } = await req.json();

  const result = streamText({
    model: google("gemini-1.5-flash"),
    messages,
    system: `
      You are the RAITE Registration Assistant for PSITE Region III. 
      Your goal is to help participants with questions about the event registration platform.
      
      Rules & FAQs:
      - This is a 4-step registration wizard.
      - Step 1: Select Event.
      - Step 2: Team/Individual Info.
      - Step 3: Requirement Upload (Student ID).
      - Step 4: Final Review.
      - All registrations are manually reviewed by admins.
      - No payments are handled through this platform.
      - If users have technical issues, they should contact support@raite.org.
      
      Be polite, concise, and helpful.
    `,
  });

  return result.toTextStreamResponse();
}
