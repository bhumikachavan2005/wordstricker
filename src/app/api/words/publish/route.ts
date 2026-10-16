import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDateString } from "@/lib/dates";
import { z } from "zod";

const PublishSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dailyWordSetId: z.string().optional(),
});

/**
 * POST /api/words/publish
 * Publishes a draft/pending daily word set.
 * - The second user (the "reviewer") calls this to approve and publish.
 * - If the submitter publishes directly, it goes directly to published (single-user approval mode).
 * - Idempotent: if already published, returns the existing record.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = PublishSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 });
  }

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);
  const targetDate = parsed.data.date ?? today;

  // Find the draft/pending set for the given date
  const dailySet = await prisma.dailyWordSet.findUnique({
    where: { date: targetDate },
    include: { items: true, submittedBy: { select: { displayName: true } } },
  });

  if (!dailySet) {
    return NextResponse.json(
      { success: false, error: "No word set found for this date." },
      { status: 404 }
    );
  }

  if (dailySet.status === "published") {
    return NextResponse.json({
      success: true,
      data: { id: dailySet.id, status: "published", message: "Already published." },
    });
  }

  if (dailySet.status === "rejected") {
    return NextResponse.json(
      { success: false, error: "This submission was rejected and cannot be published." },
      { status: 409 }
    );
  }

  if (dailySet.items.length !== 10) {
    return NextResponse.json(
      { success: false, error: "Word set must have exactly 10 words to be published." },
      { status: 422 }
    );
  }

  // Use a transaction to prevent concurrent double-publish
  try {
    const published = await prisma.$transaction(async (tx) => {
      // Re-check inside transaction to prevent races
      const current = await tx.dailyWordSet.findUnique({
        where: { date: targetDate },
        select: { status: true },
      });

      if (current?.status === "published") {
        return { alreadyPublished: true };
      }

      const updated = await tx.dailyWordSet.update({
        where: { date: targetDate },
        data: {
          status: "published",
          reviewedById: session.user.id,
          publishedAt: new Date(),
        },
      });

      return { alreadyPublished: false, updated };
    });

    if ("alreadyPublished" in published && published.alreadyPublished) {
      return NextResponse.json({
        success: true,
        data: { status: "published", message: "Already published." },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: dailySet.id,
        date: targetDate,
        status: "published",
        message: `Today's 10 words are now published! Both users can start learning.`,
      },
    });
  } catch (error) {
    console.error("Publish error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to publish. Please try again." },
      { status: 500 }
    );
  }
}
