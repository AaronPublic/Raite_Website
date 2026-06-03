import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { env } from "@/env";

export async function POST(req: Request) {
  const WEBHOOK_SECRET = env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error("Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local");
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occured -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: WebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occured", {
      status: 400,
    });
  }

  const { type, data } = evt;

  if (type === "user.created" || type === "user.updated") {
    const { id, email_addresses, first_name, last_name } = data;
    const email = email_addresses[0].email_address;
    const name = `${first_name || ""} ${last_name || ""}`.trim();

    await db.user.upsert({
      where: { clerkId: id as string },
      update: {
        email,
        name: name || null,
      },
      create: {
        clerkId: id as string,
        email,
        name: name || null,
        role: "PARTICIPANT",
      },
    });
  }

  if (type === "user.deleted") {
    const { id } = data;
    await db.user.delete({
      where: { clerkId: id as string },
    });
  }

  return new Response("Webhook received", { status: 200 });
}
