import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export default async function ParticipantsRegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getUserByClerkId(userId);

  if (!user || !user.school || !user.role) {
    redirect("/profile/complete");
  }

  if (user.role === "FACULTY_COACH") {
    if (!user.approved) {
      redirect("/");
    }

    // Non-member school category validation guard
    const schoolRecord = await db.school.findUnique({
      where: { name: user.school }
    });
    if (schoolRecord?.category === "NON_MEMBER") {
      const cookieStore = await cookies();
      const acknowledged = cookieStore.get("non_member_fee_acknowledged")?.value === "true";
      if (!acknowledged) {
        redirect("/");
      }
    }
  }

  return <>{children}</>;
}
