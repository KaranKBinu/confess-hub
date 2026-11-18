import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const email = process.argv[2]?.trim().toLowerCase();

async function main() {
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Usage: npm run admin:promote -- account@example.com");
  }
  // This command is intentionally separate from public registration. Verify the
  // account owner's identity before running it, including for production data.
  const account = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { email: true, role: true },
  });
  console.info(`Promoted ${account.email} to ${account.role}.`);
}

main()
  .catch((error: unknown) => {
    console.error("Unable to promote administrator:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
