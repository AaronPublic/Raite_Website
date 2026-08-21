"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { RegistrationStatus } from "@prisma/client";
import { getFilteredRegistrations, RegistrationFilters } from "@/lib/data/registrations";
import Papa from "papaparse";
import { sendBrevoEmail } from "@/lib/email";
import { env } from "@/env";

const EVENT_MESSENGER_LINKS: Record<string, string> = {
  "Information Technology Specialist  (Computational Thinking)": "https://m.me/j/AbZ9Tc89JVvaSENH",
  "Lanyard Layout Design": "https://m.me/j/AbZRaFuJ9S_ZzXLz",
  "Quiz Bee Challenge": "https://m.me/j/AbacnpKSpK6IzR8W",
  "Micro Short Film": "https://m.me/j/AbZE27J3-ITpvpaw",
  "TechTok Challenge: CTRL+ NEXT Edition": "https://m.me/j/AbbVukxNt2K9uO2Y",
  "Infographics Design Competition": "https://m.me/j/Aba2Dgerjiz1h-PQ",
  "Mobile Legends: Bang Bang": "https://m.me/j/AbY2SIVvO65XbsGY",
  "Valorant": "https://m.me/j/AbaAwtOinywYxZy3",
  "Mr. and Ms. Ambassador of Goodwill 2026": "https://m.me/j/Aba2Stca3deEukXc",
  "Around the World Dance Competition": "https://m.me/j/AbYtA601iRKIERRe",
  "Hackathon Programming ": "https://m.me/j/Abbu1jpQa7Iv-lWT",
  "Programming Challenge": "https://m.me/j/AbaZLWNuDmxxt_NY",
};

const updateStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(RegistrationStatus),
  comment: z.string().optional(),
});

const batchUpdateSchema = z.object({
  ids: z.array(z.string()),
  status: z.nativeEnum(RegistrationStatus),
  comment: z.string().optional(),
});

export async function batchUpdateRegistrationStatus(data: z.infer<typeof batchUpdateSchema>) {
  const { ids, status, comment } = batchUpdateSchema.parse(data);
  await checkAccess(undefined, ids);

  try {
    const registrations = await db.registration.findMany({
      where: { id: { in: ids } },
      include: { event: true, user: true, coach: true }
    });

    await db.registration.updateMany({
      where: { id: { in: ids } },
      data: { 
        status,
        adminComment: comment || null,
        requirementsVerified: status === "APPROVED" ? true : undefined
      },
    });

    // Send emails
    for (const reg of registrations) {
      if (status === "APPROVED") {
        try {
          const to = [{ email: reg.user.email }];
          if (reg.coach?.email) {
            to.push({ email: reg.coach.email });
          }
          const messengerLink = EVENT_MESSENGER_LINKS[reg.event.title.trim()];
          const messengerBlock = messengerLink ? `
            <div style="margin: 20px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #1e40af;"><strong>FB Messenger Group Chat:</strong> <a href="${messengerLink}" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Join Group Chat</a></p>
              <p style="margin: 0; font-size: 12px; color: #1e3a8a; font-style: italic;"><strong>NOTE:</strong> All competitors/ coaches, please join the respective FB Messenger Group for more information and other queries.</p>
            </div>
          ` : "";
          await sendBrevoEmail({
            subject: `RAITE 2026 - Registration Approved: ${reg.event.title}`,
            to,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
                  <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <h3 style="color: #16a34a; font-size: 18px; font-weight: 700; margin-top: 0;">Registration Approved</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${reg.user.name || "Participant"}</strong>${reg.coach?.name ? ` and Coach <strong>${reg.coach.name}</strong>` : ""},</p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your registration for the event/competition <strong>${reg.event.title}</strong> has been officially <strong>approved</strong> by the administrator.</p>
                <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534;"><strong>Event:</strong> ${reg.event.title}</p>
                  <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Status:</strong> Approved</p>
                </div>
                ${messengerBlock}
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">You can check the details of this registration on the RAITE portal.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #0038a8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View Dashboard</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
                <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
              </div>
            `
          });
        } catch (err) {
          console.error("Failed to send batch approval email:", err);
        }
      } else if (status === "WAITLISTED") {
        try {
          const to = [{ email: reg.user.email }];
          if (reg.coach?.email) {
            to.push({ email: reg.coach.email });
          }
          await sendBrevoEmail({
            subject: `RAITE 2026 - Action Required: Registration Review for ${reg.event.title}`,
            to,
            htmlContent: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
                <div style="text-align: center; margin-bottom: 20px;">
                  <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
                  <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
                <h3 style="color: #ea580c; font-size: 18px; font-weight: 700; margin-top: 0;">Action Required: Registration Under Review</h3>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${reg.user.name || "Participant"}</strong>${reg.coach?.name ? ` and Coach <strong>${reg.coach.name}</strong>` : ""},</p>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your registration for the event/competition <strong>${reg.event.title}</strong> has been flagged for review.</p>
                <div style="margin: 20px 0; padding: 15px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #ffedd5;">
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #9a3412;"><strong>Event:</strong> ${reg.event.title}</p>
                  <p style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;"><strong>Feedback from Admin:</strong></p>
                  <p style="margin: 5px 0 0 0; font-size: 13px; color: #431407; font-style: italic; background-color: #ffffff; padding: 8px; border-radius: 4px; border-left: 3px solid #ea580c;">${comment || "No comments provided."}</p>
                </div>
                <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please log in to the portal to view and resolve this request so we can complete your registration.</p>
                <div style="text-align: center; margin-top: 30px;">
                  <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Review Registration</a>
                </div>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
                <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
              </div>
            `
          });
        } catch (err) {
          console.error("Failed to send batch review email:", err);
        }
      }
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update registrations" };
  }
}

const revisionSchema = z.object({
  id: z.string(),
  comment: z.string().min(5, "Comment must be at least 5 characters"),
});

export async function checkAccess(registrationId?: string, registrationIds?: string[]) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const user = await db.user.findUnique({ where: { clerkId: userId } });
  if (!user) throw new Error("Forbidden");
  
  if (user.role === "ADMIN") return user;
  
  if (user.role === "SUB_ADMIN") {
    if (registrationId) {
      const reg = await db.registration.findUnique({
        where: { id: registrationId },
        include: { event: true }
      });
      if (reg && reg.event.subAdminId === user.id) return user;
    }
    
    if (registrationIds && registrationIds.length > 0) {
      const regs = await db.registration.findMany({
        where: { id: { in: registrationIds } },
        include: { event: true }
      });
      const allAssigned = regs.every(reg => reg.event.subAdminId === user.id);
      if (allAssigned && regs.length === registrationIds.length) return user;
    }
  }
  
  throw new Error("Forbidden");
}

export async function updateRegistrationStatus(data: z.infer<typeof updateStatusSchema>) {
  const { id, status, comment } = updateStatusSchema.parse(data);
  await checkAccess(id);

  try {
    const registration = await db.registration.findUnique({
      where: { id },
      include: { event: true, user: true, coach: true }
    });

    if (!registration) throw new Error("Registration not found");

    await db.registration.update({
      where: { id },
      data: { 
        status,
        adminComment: comment || null,
        requirementsVerified: status === "APPROVED" ? true : undefined
      },
    });

    if (status === "APPROVED") {
      try {
        const to = [{ email: registration.user.email }];
        if (registration.coach?.email) {
          to.push({ email: registration.coach.email });
        }
        const messengerLink = EVENT_MESSENGER_LINKS[registration.event.title.trim()];
        const messengerBlock = messengerLink ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #eff6ff; border-radius: 8px; border: 1px solid #bfdbfe;">
            <p style="margin: 0 0 8px 0; font-size: 13px; color: #1e40af;"><strong>FB Messenger Group Chat:</strong> <a href="${messengerLink}" style="color: #2563eb; text-decoration: underline; font-weight: bold;">Join Group Chat</a></p>
            <p style="margin: 0; font-size: 12px; color: #1e3a8a; font-style: italic;"><strong>NOTE:</strong> All competitors/ coaches, please join the respective FB Messenger Group for more information and other queries.</p>
          </div>
        ` : "";
        await sendBrevoEmail({
          subject: `RAITE 2026 - Registration Approved: ${registration.event.title}`,
          to,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
                <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <h3 style="color: #16a34a; font-size: 18px; font-weight: 700; margin-top: 0;">Registration Approved</h3>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${registration.user.name || "Participant"}</strong>${registration.coach?.name ? ` and Coach <strong>${registration.coach.name}</strong>` : ""},</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your registration for the event/competition <strong>${registration.event.title}</strong> has been officially <strong>approved</strong> by the administrator.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #166534;"><strong>Event:</strong> ${registration.event.title}</p>
                <p style="margin: 0; font-size: 13px; color: #166534;"><strong>Status:</strong> Approved</p>
              </div>
              ${messengerBlock}
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">You can check the details of this registration on the RAITE portal.</p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #0038a8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">View Dashboard</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
            </div>
          `
        });
      } catch (err) {
        console.error("Failed to send approval email:", err);
      }
    } else if (status === "WAITLISTED") {
      try {
        const to = [{ email: registration.user.email }];
        if (registration.coach?.email) {
          to.push({ email: registration.coach.email });
        }
        await sendBrevoEmail({
          subject: `RAITE 2026 - Action Required: Registration Review for ${registration.event.title}`,
          to,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 20px;">
                <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
                <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
              <h3 style="color: #ea580c; font-size: 18px; font-weight: 700; margin-top: 0;">Action Required: Registration Under Review</h3>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${registration.user.name || "Participant"}</strong>${registration.coach?.name ? ` and Coach <strong>${registration.coach.name}</strong>` : ""},</p>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your registration for the event/competition <strong>${registration.event.title}</strong> has been flagged for review.</p>
              <div style="margin: 20px 0; padding: 15px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #ffedd5;">
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #9a3412;"><strong>Event:</strong> ${registration.event.title}</p>
                <p style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;"><strong>Feedback from Admin:</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #431407; font-style: italic; background-color: #ffffff; padding: 8px; border-radius: 4px; border-left: 3px solid #ea580c;">${comment || "No comments provided."}</p>
              </div>
              <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please log in to the portal to view and resolve this request so we can complete your registration.</p>
              <div style="text-align: center; margin-top: 30px;">
                <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Review Registration</a>
              </div>
              <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
              <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
            </div>
          `
        });
      } catch (err) {
        console.error("Failed to send review email:", err);
      }
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to update status" };
  }
}

export async function toggleRequirementsVerified(id: string) {
  await checkAccess(id);

  try {
    const registration = await db.registration.findUnique({
      where: { id },
      select: { requirementsVerified: true }
    });

    if (!registration) return { error: "Registration not found" };

    await db.registration.update({
      where: { id },
      data: { requirementsVerified: !registration.requirementsVerified },
    });
    
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to toggle verification" };
  }
}


export async function submitRevisionRequest(data: z.infer<typeof revisionSchema>) {
  const { id, comment } = revisionSchema.parse(data);
  await checkAccess(id);

  try {
    const registration = await db.registration.findUnique({
      where: { id },
      include: { event: true, user: true, coach: true }
    });

    if (!registration) throw new Error("Registration not found");

    await db.registration.update({
      where: { id },
      data: { 
        status: "WAITLISTED", // Or a specific revision state if we had one
        adminComment: comment 
      },
    });

    // Send email that it is flagged for review with comments
    try {
      const to = [{ email: registration.user.email }];
      if (registration.coach?.email) {
        to.push({ email: registration.coach.email });
      }
      await sendBrevoEmail({
        subject: `RAITE 2026 - Action Required: Revision Requested for ${registration.event.title}`,
        to,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #0038a8; margin: 0; font-size: 24px; font-weight: 800;">RAITE 2026</h2>
              <p style="color: #6b7280; margin: 5px 0 0 0; font-size: 14px; font-weight: 600;">PSITE Region III</p>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
            <h3 style="color: #ea580c; font-size: 18px; font-weight: 700; margin-top: 0;">Action Required: Revision Requested</h3>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Hello <strong>${registration.user.name || "Participant"}</strong>${registration.coach?.name ? ` and Coach <strong>${registration.coach.name}</strong>` : ""},</p>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Your registration for the event/competition <strong>${registration.event.title}</strong> has been flagged for review. A revision is required before this registration can be approved.</p>
            <div style="margin: 20px 0; padding: 15px; background-color: #fff7ed; border-radius: 8px; border: 1px solid #ffedd5;">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #9a3412;"><strong>Event:</strong> ${registration.event.title}</p>
              <p style="margin: 0 0 8px 0; font-size: 13px; color: #c2410c;"><strong>Feedback from Admin:</strong></p>
              <p style="margin: 5px 0 0 0; font-size: 13px; color: #431407; font-style: italic; background-color: #ffffff; padding: 8px; border-radius: 4px; border-left: 3px solid #ea580c;">${comment || "No comments provided."}</p>
            </div>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5;">Please log in to the portal to resolve this request so we can complete your registration.</p>
            <div style="text-align: center; margin-top: 30px;">
              <a href="${env.NEXT_PUBLIC_APP_URL || "http://localhost:3000/"}" style="display: inline-block; padding: 12px 24px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 14px;">Review Registration</a>
            </div>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 30px 0 20px 0;" />
            <p style="color: #9ca3af; font-size: 11px; text-align: center; margin: 0;">This is an automated notification. Please do not reply directly to this email.</p>
          </div>
        `
      });
    } catch (err) {
      console.error("Failed to send revision request email:", err);
    }

    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to submit revision request" };
  }
}

export async function deleteRegistration(id: string) {
  await checkAccess(id);

  try {
    await db.registration.delete({
      where: { id },
    });
    revalidatePath("/admin/registrations");
    revalidatePath("/sub-admin/competitions");
    return { success: true };
  } catch (error) {
    return { error: "Failed to delete registration" };
  }
}

export async function exportRegistrationsCSV(filters: RegistrationFilters) {
  await checkAccess(); // Admin check
  const registrations = await getFilteredRegistrations(filters);

  // Fetch all schools to map name to category
  const schools = await db.school.findMany({
    select: { name: true, category: true }
  });
  const schoolCategoryMap = new Map<string, string>();
  schools.forEach(s => schoolCategoryMap.set(s.name, s.category));

  // Collect all member emails so we can resolve names in one DB query
  const allMemberEmails = new Set<string>();
  registrations.forEach(r => {
    if (Array.isArray(r.members)) {
      (r.members as string[]).forEach(email => allMemberEmails.add(email));
    }
  });

  // Fetch name lookup map (email → name) for all member emails
  const emailToName = new Map<string, string>();
  if (allMemberEmails.size > 0) {
    const users = await db.user.findMany({
      where: { email: { in: Array.from(allMemberEmails) } },
      select: { email: true, name: true },
    });
    users.forEach(u => emailToName.set(u.email, u.name || u.email));
  }

  const data = registrations.map(r => {
    // Build full competitors list: all members resolved to names, or primary registrant
    let competitorNames = r.user.name || r.user.email;
    if (Array.isArray(r.members) && (r.members as string[]).length > 0) {
      const memberNames = (r.members as string[]).map(
        email => emailToName.get(email) || email
      );
      competitorNames = memberNames.join("; ");
    }

    // Parse requirements links (record of key → URL string)
    let requirementsLinks = "N/A";
    if (r.requirements && typeof r.requirements === "object") {
      const reqs = r.requirements as Record<string, string>;
      const pairs = Object.entries(reqs)
        .filter(([, v]) => typeof v === "string" && v.trim() !== "")
        .map(([k, v]) => `${k}: ${v}`);
      if (pairs.length > 0) requirementsLinks = pairs.join(" | ");
    }

    const schoolName = r.user.school || "N/A";
    const schoolCategory = schoolName !== "N/A" ? (schoolCategoryMap.get(schoolName) || "N/A") : "N/A";
    const coachCategory = r.coach ? (r.coach.category || "N/A") : "N/A";

    return {
      School: schoolName,
      "School Membership": schoolCategory,
      Competition: r.event.title,
      Status: r.status,
      "Team Name": r.teamName || "Individual",
      "All Competitors": competitorNames,
      "Primary Registrant": r.user.name || "N/A",
      "Primary Registrant Email": r.user.email,
      Coach: r.coach?.name || r.registeredBy || "N/A",
      "Coach Email": r.coach?.email || "N/A",
      "Coach Membership": coachCategory,
      "Entry/Submission Link": r.entryUrl || "N/A",
      "Requirements Links": requirementsLinks,
      RegisteredAt: new Date(r.createdAt).toLocaleDateString(),
    };
  });

  return Papa.unparse(data);
}

export async function getRegistrationsForPDF(filters: RegistrationFilters) {
  await checkAccess(); // Admin check
  const registrations = await getFilteredRegistrations(filters);

  // Fetch all schools to map name to category
  const schools = await db.school.findMany({
    select: { name: true, category: true }
  });
  const schoolCategoryMap = new Map<string, string>();
  schools.forEach(s => schoolCategoryMap.set(s.name, s.category));
  
  return registrations.map(r => {
    const schoolName = r.user.school || "N/A";
    const schoolCategory = schoolName !== "N/A" ? (schoolCategoryMap.get(schoolName) || "N/A") : "N/A";
    const coachCategory = r.coach ? (r.coach.category || "N/A") : "N/A";

    return {
      school: schoolName,
      schoolCategory: schoolCategory,
      competition: r.event.title,
      status: r.status,
      coach: r.coach?.name || r.registeredBy || "N/A",
      coachCategory: coachCategory,
      date: new Date(r.createdAt).toLocaleDateString()
    };
  });
}
