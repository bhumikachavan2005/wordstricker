import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = (process.argv[2] || "vinuu").toLowerCase();
  const newPassword = process.argv[3] || "password123";

  if (username !== "vinuu" && username !== "bhuu") {
    console.error("Usage: npm run db:reset-pw [vinuu|bhuu] [newPassword]");
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.user.update({
    where: { username },
    data: { passwordHash },
  });

  console.log(`\n✅ Password for @${username} successfully reset to: "${newPassword}"\n`);
}

main()
  .catch((e) => {
    console.error("Failed to reset password:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
