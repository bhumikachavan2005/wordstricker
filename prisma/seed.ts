/**
 * Prisma Database Seed Script
 * Creates:
 *  - Vinuu and Bhuu user accounts (using env-configured passwords)
 *  - SharedStreak singleton
 *  - Achievement catalog
 *
 * Usage: npm run db:seed
 * 
 * Passwords are read from environment variables.
 * For first-time setup, copy .env.example to .env and set passwords.
 */

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ACHIEVEMENTS = [
  { key: "first_word", name: "First Word!", description: "Register your very first vocabulary word", icon: "📝", category: "vocab", xpReward: 50, threshold: 1 },
  { key: "words_10", name: "Deca-Learner", description: "Register 10 vocabulary words", icon: "📚", category: "vocab", xpReward: 100, threshold: 10 },
  { key: "words_50", name: "Word Enthusiast", description: "Register 50 vocabulary words", icon: "🎓", category: "vocab", xpReward: 300, threshold: 50 },
  { key: "words_100", name: "Vocabulary Master", description: "Register 100 vocabulary words", icon: "👑", category: "vocab", xpReward: 500, threshold: 100 },
  { key: "words_365", name: "Word Legend", description: "Register 365 vocabulary words", icon: "🌟", category: "vocab", xpReward: 2000, threshold: 365 },
  { key: "streak_3", name: "Hat Trick", description: "Maintain a 3-day streak", icon: "🔥", category: "streak", xpReward: 75, threshold: 3 },
  { key: "streak_7", name: "Week Warrior", description: "Maintain a 7-day streak", icon: "⚡", category: "streak", xpReward: 200, threshold: 7 },
  { key: "streak_30", name: "Monthly Champion", description: "Maintain a 30-day streak", icon: "🏆", category: "streak", xpReward: 1000, threshold: 30 },
  { key: "streak_100", name: "Century Streak", description: "Maintain a 100-day streak", icon: "💎", category: "streak", xpReward: 5000, threshold: 100 },
  { key: "quiz_perfect", name: "Perfect Score", description: "Get 100% on a daily quiz", icon: "🎯", category: "quiz", xpReward: 150, threshold: null },
  { key: "quiz_10", name: "Quiz Regular", description: "Complete 10 quizzes", icon: "✏️", category: "quiz", xpReward: 200, threshold: 10 },
  { key: "vault_star_10", name: "Star Collector", description: "Star 10 words in your Word Vault", icon: "⭐", category: "vocab", xpReward: 100, threshold: 10 },
  { key: "first_lockin", name: "Committed", description: "Lock in your first daily completion", icon: "🔒", category: "general", xpReward: 50, threshold: null },
  { key: "both_lockin_day1", name: "Synchronized", description: "Both users lock in on the same day for the first time", icon: "🤝", category: "special", xpReward: 200, threshold: null },
];

async function main() {
  console.log("🌱 Seeding WordStreak database...\n");

  // ── Create users ──────────────────────────────────────────────────────────
  const vinuuPassword = process.env.SEED_VINUU_PASSWORD;
  const bhuuPassword = process.env.SEED_BHUU_PASSWORD;

  if (!vinuuPassword || !bhuuPassword) {
    throw new Error(
      "SEED_VINUU_PASSWORD and SEED_BHUU_PASSWORD must be set in .env before seeding."
    );
  }

  const SALT_ROUNDS = 12;

  const vinuu = await prisma.user.upsert({
    where: { username: "vinuu" },
    create: {
      username: "vinuu",
      passwordHash: await bcrypt.hash(vinuuPassword, SALT_ROUNDS),
      displayName: "Vinuu",
      avatarColor: "#7C3AED",
      theme: "purple",
      timezone: "Asia/Kolkata",
    },
    update: {},
  });

  const bhuu = await prisma.user.upsert({
    where: { username: "bhuu" },
    create: {
      username: "bhuu",
      passwordHash: await bcrypt.hash(bhuuPassword, SALT_ROUNDS),
      displayName: "Bhuu",
      avatarColor: "#F59E0B",
      theme: "amber",
      timezone: "Asia/Kolkata",
    },
    update: {},
  });

  console.log(`✅ Created users: @${vinuu.username} and @${bhuu.username}`);

  // ── Create SharedStreak singleton ─────────────────────────────────────────
  await prisma.sharedStreak.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });
  console.log("✅ Created SharedStreak singleton");

  // ── Seed achievements ─────────────────────────────────────────────────────
  for (const ach of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { key: ach.key },
      create: ach,
      update: {
        name: ach.name,
        description: ach.description,
        icon: ach.icon,
        xpReward: ach.xpReward,
      },
    });
  }
  console.log(`✅ Seeded ${ACHIEVEMENTS.length} achievements`);

  console.log("\n🎉 Database seeded successfully!");
  console.log("\nYou can now start the app with: npm run dev");
  console.log("Login credentials:");
  console.log("  @vinuu → password from SEED_VINUU_PASSWORD in .env");
  console.log("  @bhuu  → password from SEED_BHUU_PASSWORD in .env");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
