import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const VaultActionSchema = z.object({
  vocabularyWordId: z.string(),
  action: z.enum(["toggle", "update", "review"]),
  privateNotes: z.string().optional(),
  masteryLevel: z.number().int().min(0).max(5).optional(),
});

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const masteryParam = searchParams.get("mastery");
  const sortBy = searchParams.get("sortBy") || "newest"; // newest | oldest | mastery | alpha

  try {
    const whereClause: any = {
      userId: session.user.id,
      isFavorited: true,
    };

    if (masteryParam !== null && masteryParam !== undefined && masteryParam !== "") {
      whereClause.masteryLevel = parseInt(masteryParam, 10);
    }

    if (search) {
      whereClause.vocabularyWord = {
        OR: [
          { word: { contains: search } },
          { meaning: { contains: search } },
        ],
      };
    }

    let orderBy: any = { createdAt: "desc" };
    if (sortBy === "oldest") orderBy = { createdAt: "asc" };
    if (sortBy === "mastery") orderBy = { masteryLevel: "desc" };
    if (sortBy === "alpha") orderBy = { vocabularyWord: { word: "asc" } };

    const savedWords = await prisma.savedWord.findMany({
      where: whereClause,
      include: {
        vocabularyWord: {
          include: {
            submittedBy: {
              select: { displayName: true, username: true },
            },
          },
        },
      },
      orderBy,
    });

    const formatted = savedWords.map((sw) => ({
      id: sw.id,
      vocabularyWordId: sw.vocabularyWordId,
      word: sw.vocabularyWord.word,
      meaning: sw.vocabularyWord.meaning,
      pronunciation: sw.vocabularyWord.pronunciation,
      partOfSpeech: sw.vocabularyWord.partOfSpeech,
      exampleSentence: sw.vocabularyWord.exampleSentence,
      difficulty: sw.vocabularyWord.difficulty,
      submittedBy: sw.vocabularyWord.submittedBy.displayName,
      isFavorited: sw.isFavorited,
      privateNotes: sw.privateNotes,
      masteryLevel: sw.masteryLevel,
      timesReviewed: sw.timesReviewed,
      lastReviewedAt: sw.lastReviewedAt?.toISOString() ?? null,
      savedAt: sw.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: {
        total: formatted.length,
        savedWords: formatted,
      },
    });
  } catch (error) {
    console.error("Vault GET error:", error);
    return NextResponse.json({ success: false, error: "Failed to load Word Vault" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = VaultActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { vocabularyWordId, action, privateNotes, masteryLevel } = parsed.data;

    // Check if word exists
    const word = await prisma.vocabularyWord.findUnique({
      where: { id: vocabularyWordId },
    });
    if (!word) {
      return NextResponse.json({ success: false, error: "Word not found" }, { status: 404 });
    }

    const existing = await prisma.savedWord.findUnique({
      where: {
        userId_vocabularyWordId: {
          userId: session.user.id,
          vocabularyWordId,
        },
      },
    });

    if (action === "toggle") {
      if (existing) {
        // Toggle favorite status
        const updated = await prisma.savedWord.update({
          where: { id: existing.id },
          data: { isFavorited: !existing.isFavorited },
        });
        return NextResponse.json({
          success: true,
          data: { isSaved: updated.isFavorited, action: "toggled" },
        });
      } else {
        // Create new saved word
        await prisma.savedWord.create({
          data: {
            userId: session.user.id,
            vocabularyWordId,
            isFavorited: true,
            masteryLevel: 0,
          },
        });
        return NextResponse.json({
          success: true,
          data: { isSaved: true, action: "saved" },
        });
      }
    }

    if (action === "update") {
      const updateData: any = {};
      if (privateNotes !== undefined) updateData.privateNotes = privateNotes;
      if (masteryLevel !== undefined) updateData.masteryLevel = masteryLevel;

      const updated = await prisma.savedWord.upsert({
        where: {
          userId_vocabularyWordId: {
            userId: session.user.id,
            vocabularyWordId,
          },
        },
        update: updateData,
        create: {
          userId: session.user.id,
          vocabularyWordId,
          isFavorited: true,
          privateNotes: privateNotes || "",
          masteryLevel: masteryLevel || 0,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          id: updated.id,
          masteryLevel: updated.masteryLevel,
          privateNotes: updated.privateNotes,
        },
      });
    }

    if (action === "review") {
      // Increase review count and optionally bump mastery level
      const currentLevel = existing?.masteryLevel ?? 0;
      const newLevel = Math.min(5, currentLevel + 1);

      const updated = await prisma.savedWord.upsert({
        where: {
          userId_vocabularyWordId: {
            userId: session.user.id,
            vocabularyWordId,
          },
        },
        update: {
          timesReviewed: { increment: 1 },
          lastReviewedAt: new Date(),
          masteryLevel: newLevel,
        },
        create: {
          userId: session.user.id,
          vocabularyWordId,
          isFavorited: true,
          timesReviewed: 1,
          lastReviewedAt: new Date(),
          masteryLevel: 1,
        },
      });

      return NextResponse.json({
        success: true,
        data: {
          masteryLevel: updated.masteryLevel,
          timesReviewed: updated.timesReviewed,
        },
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Vault POST error:", error);
    return NextResponse.json({ success: false, error: "Failed to update Word Vault" }, { status: 500 });
  }
}
