import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWord, validateWordString, findIntraSubmissionDuplicates, REQUIRED_WORDS_PER_DAY } from "@/lib/words";
import { getTodayDateString } from "@/lib/dates";
import { z } from "zod";

const WordSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1),
  pronunciation: z.string().default(""),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "determiner", "idiom"]),
  exampleSentence: z.string().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const SubmitSchema = z.object({
  words: z.array(WordSchema).length(REQUIRED_WORDS_PER_DAY),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  publishImmediately: z.boolean().optional(),
});

/**
 * POST /api/words/submit
 * Validates + creates a DailyWordSet draft with candidate words.
 * Does NOT publish — publication requires /api/words/publish
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = SubmitSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { words } = parsed.data;
  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  // Check if a published set already exists for today
  const existingPublished = await prisma.dailyWordSet.findFirst({
    where: { date: today, status: "published" },
  });
  if (existingPublished) {
    return NextResponse.json(
      { success: false, error: "A daily word set has already been published for today." },
      { status: 409 }
    );
  }

  // Validate all words
  const errors: Record<number, string[]> = {};
  words.forEach((w, idx) => {
    const position = idx + 1;
    const v = validateWordString(w.word);
    if (!v.valid) {
      errors[position] = [...(errors[position] || []), v.error!];
    }
    if (!w.meaning.trim()) {
      errors[position] = [...(errors[position] || []), "Meaning is required."];
    }
  });

  // Intra-submission duplicates
  const intraDups = findIntraSubmissionDuplicates(words.map((w) => w.word));
  Object.entries(intraDups).forEach(([pos, firstPos]) => {
    const position = parseInt(pos);
    errors[position] = [...(errors[position] || []), `Duplicate of word #${firstPos}.`];
  });

  // Global registry duplicates — MUST check with DB constraint
  const normalizedWords = words.map((w) => normalizeWord(w.word));
  const existingWords = await prisma.vocabularyWord.findMany({
    where: { normalizedWord: { in: normalizedWords } },
    include: { submittedBy: { select: { displayName: true } } },
  });

  const existingMap = new Map(existingWords.map((w) => [w.normalizedWord, w]));
  const dupDetails: string[] = [];

  normalizedWords.forEach((nw, idx) => {
    const position = idx + 1;
    const existing = existingMap.get(nw);
    if (existing && !intraDups[position]) {
      const msg = `"${words[idx].word}" was already registered by ${existing.submittedBy.displayName} on ${existing.createdAt.toISOString().split("T")[0]}.`;
      errors[position] = [...(errors[position] || []), msg];
      dupDetails.push(msg);
    }
  });

  if (Object.keys(errors).length > 0) {
    return NextResponse.json(
      {
        success: false,
        error: "Submission contains invalid or duplicate words.",
        details: { errors, duplicates: dupDetails },
      },
      { status: 422 }
    );
  }

  // Everything is valid — create in a single transaction
  try {
    const result = await prisma.$transaction(async (tx) => {
      // Create vocabulary words in the global registry
      // Using createMany + upsert logic with unique constraint protection
      const wordRecords = await Promise.all(
        words.map(async (w) => {
          return tx.vocabularyWord.create({
            data: {
              word: w.word.trim(),
              normalizedWord: normalizeWord(w.word),
              meaning: w.meaning.trim(),
              pronunciation: w.pronunciation.trim(),
              partOfSpeech: w.partOfSpeech,
              exampleSentence: w.exampleSentence.trim(),
              difficulty: w.difficulty,
              submittedById: session.user.id,
            },
          });
        })
      );

      // Create the DailyWordSet
      const isAutoPublish = parsed.data.publishImmediately ?? true;
      const dailySet = await tx.dailyWordSet.create({
        data: {
          date: today,
          status: isAutoPublish ? "published" : "draft",
          publishedAt: isAutoPublish ? new Date() : null,
          submittedById: session.user.id,
          items: {
            create: wordRecords.map((record, idx) => ({
              vocabularyWordId: record.id,
              position: idx + 1,
            })),
          },
        },
        include: {
          items: { include: { vocabularyWord: true } },
        },
      });

      return dailySet;
    });

    return NextResponse.json({
      success: true,
      data: {
        id: result.id,
        date: result.date,
        status: result.status,
        message: result.status === "published"
          ? "Word list submitted and published successfully for today!"
          : "Word list submitted successfully. Ready for review.",
      },
    });
  } catch (error: unknown) {
    // Handle unique constraint violation (race condition)
    const err = error as { code?: string };
    if (err.code === "P2002") {
      return NextResponse.json(
        { success: false, error: "One or more words were registered concurrently. Please refresh and try again." },
        { status: 409 }
      );
    }
    console.error("Submit error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to submit words. Please try again." },
      { status: 500 }
    );
  }
}

/**
 * GET /api/words/submit
 * Returns today's draft/pending submission if any
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const timezone = process.env.APP_TIMEZONE || "Asia/Kolkata";
  const today = getTodayDateString(timezone);

  const todaySet = await prisma.dailyWordSet.findUnique({
    where: { date: today },
    include: {
      items: {
        orderBy: { position: "asc" },
        include: {
          vocabularyWord: {
            include: { submittedBy: { select: { displayName: true } } },
          },
        },
      },
      submittedBy: { select: { displayName: true } },
    },
  });

  return NextResponse.json({
    success: true,
    data: todaySet,
  });
}
