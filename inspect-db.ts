import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  console.log("Checking models in PrismaClient:");
  console.log("Available models:", Object.keys(prisma).filter(k => !k.startsWith('_') && !k.startsWith('$')));
  
  try {
    const winners = await (prisma as any).competitionWinner.findMany();
    console.log("CompetitionWinner is accessible!");
  } catch (e: any) {
    console.log("CompetitionWinner is NOT accessible:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
