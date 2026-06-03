import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUserByClerkId } from "@/lib/data/users";
import WizardLayout from "./WizardLayout";

export default async function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await getUserByClerkId(userId);

  if (!user || !user.school || !user.course || !user.yearLevel) {
    redirect("/profile/complete");
  }

  return <WizardLayout>{children}</WizardLayout>;
}
