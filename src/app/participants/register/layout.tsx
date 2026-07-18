import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";

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

  if (user.role === "FACULTY_COACH" && !user.approved) {
    redirect("/");
  }

  return <>{children}</>;
}
