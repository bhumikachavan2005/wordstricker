import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tryUpdateTodayStreak } from "@/lib/streak";
import { getTodayDateString } from "@/lib/dates";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { z } from "zod";

const LockInSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

/**
 * POST /api/progress/lock-in
 * Records a user's daily learning completion (Lock-In).
 * Idempotent — safe to call multiple times.
 * Backend validates requirements before accepting.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = LockInSchema.safeParse(body);
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);
  const targetDate = parsed.data?.date ?? today;

  // Only allow lock-in for today
  if (targetDate !== today) {
    return NextResponse.json(
      { success: false, error: "Lock-In can only be recorded for today." },
      { status: 400 }
    );
  }

  // Ensure today has a published word set
  const dailySet = await prisma.dailyWordSet.findUnique({
    where: { date: today, status: "published" },
  });

  if (!dailySet) {
    return NextResponse.json(
      { success: false, error: "No published word set for today. Cannot Lock In." },
      { status: 409 }
    );
  }

  // Check minimum review requirement (must have reviewed at least some words)
  const existingProgress = await prisma.userDailyProgress.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  // Allow lock-in if at least 5 words reviewed
  const wordsReviewed = existingProgress?.wordsReviewed ?? 0;
  if (wordsReviewed < 5) {
    return NextResponse.json(
      {
        success: false,
        error: `You need to review at least 5 words before locking in. You've reviewed ${wordsReviewed} so far.`,
      },
      { status: 422 }
    );
  }

  // Idempotent upsert — if already locked in, return success
  const progress = await prisma.userDailyProgress.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: {
      userId: session.user.id,
      dailyWordSetId: dailySet.id,
      date: today,
      isLockedIn: true,
      lockedInAt: new Date(),
      status: "locked_in",
      wordsReviewed,
      lastActivityAt: new Date(),
    },
    update: {
      isLockedIn: true,
      lockedInAt: existingProgress?.isLockedIn ? existingProgress.lockedInAt : new Date(),
      status: "locked_in",
      lastActivityAt: new Date(),
    },
  });

  const wasAlreadyLockedIn = existingProgress?.isLockedIn ?? false;

  // Update streak history if this is a new lock-in
  if (!wasAlreadyLockedIn) {
    await tryUpdateTodayStreak(session.user.id);
    await checkAndAwardAchievements(session.user.id, "lock_in");
  }

  return NextResponse.json({
    success: true,
    data: {
      isLockedIn: progress.isLockedIn,
      lockedInAt: progress.lockedInAt?.toISOString(),
      wasAlreadyLockedIn,
      message: wasAlreadyLockedIn
        ? "Already locked in for today! 🔒"
        : "Locked in! Great work today! 🎉",
    },
  });
}

/**
 * PATCH /api/progress/lock-in
 * Update word review progress (not lock-in)
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const { wordsReviewed, quizScore, quizTotal } = body;

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  const dailySet = await prisma.dailyWordSet.findUnique({
    where: { date: today, status: "published" },
  });

  if (!dailySet) {
    return NextResponse.json(
      { success: false, error: "No published word set for today." },
      { status: 404 }
    );
  }

  const existing = await prisma.userDailyProgress.findUnique({
    where: { userId_date: { userId: session.user.id, date: today } },
  });

  const newWordsReviewed = Math.max(
    existing?.wordsReviewed ?? 0,
    typeof wordsReviewed === "number" ? wordsReviewed : 0
  );

  let status = existing?.status ?? "not_started";
  if (existing?.isLockedIn) {
    status = "locked_in";
  } else if (newWordsReviewed >= 10) {
    status = "completed";
  } else if (newWordsReviewed > 0) {
    status = "learning";
  }

  const progress = await prisma.userDailyProgress.upsert({
    where: { userId_date: { userId: session.user.id, date: today } },
    create: {
      userId: session.user.id,
      dailyWordSetId: dailySet.id,
      date: today,
      wordsReviewed: newWordsReviewed,
      quizScore: typeof quizScore === "number" ? quizScore : null,
      quizTotal: typeof quizTotal === "number" ? quizTotal : null,
      status,
      lastActivityAt: new Date(),
    },
    update: {
      wordsReviewed: newWordsReviewed,
      ...(typeof quizScore === "number" && typeof quizTotal === "number"
        ? { quizScore, quizTotal }
        : {}),
      status,
      lastActivityAt: new Date(),
    },
  });

  return NextResponse.json({ success: true, data: progress });
}
