import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeWord, validateWordString, findIntraSubmissionDuplicates, REQUIRED_WORDS_PER_DAY } from "@/lib/words";
import { z } from "zod";

const WordSchema = z.object({
  word: z.string().min(1),
  meaning: z.string().min(1, "Meaning is required"),
  pronunciation: z.string().default(""),
  partOfSpeech: z.enum(["noun", "verb", "adjective", "adverb", "pronoun", "preposition", "conjunction", "interjection", "determiner"]),
  exampleSentence: z.string().default(""),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

const ValidateSchema = z.object({
  words: z.array(WordSchema).length(REQUIRED_WORDS_PER_DAY),
});

/**
 * POST /api/words/validate
 * Validates a list of 10 words against the global registry.
 * Returns detailed duplicate info for each invalid word.
 * Does NOT create any records.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = ValidateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid request format", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { words } = parsed.data;
  const errors: Record<number, string[]> = {};

  // Step 1: Individual word format validation
  words.forEach((w, idx) => {
    const position = idx + 1;
    const validation = validateWordString(w.word);
    if (!validation.valid) {
      errors[position] = errors[position] || [];
      errors[position].push(validation.error!);
    }
    if (!w.meaning.trim()) {
      errors[position] = errors[position] || [];
      errors[position].push("Meaning is required.");
    }
  });

  // Step 2: Intra-submission duplicates
  const intraDups = findIntraSubmissionDuplicates(words.map((w) => w.word));
  Object.entries(intraDups).forEach(([pos, firstPos]) => {
    const position = parseInt(pos);
    errors[position] = errors[position] || [];
    errors[position].push(`Duplicate of word #${firstPos} in this submission.`);
  });

  // Step 3: Check against global registry
  const normalizedWords = words.map((w) => normalizeWord(w.word));
  const existing = await prisma.vocabularyWord.findMany({
    where: { normalizedWord: { in: normalizedWords } },
    include: { submittedBy: { select: { displayName: true } } },
  });

  const existingMap = new Map(existing.map((w) => [w.normalizedWord, w]));

  const duplicateInfos: Array<{
    position: number;
    word: string;
    normalizedWord: string;
    originalDate: string;
    originalContributor: string;
    message: string;
  }> = [];

  normalizedWords.forEach((nw, idx) => {
    const position = idx + 1;
    const existing = existingMap.get(nw);
    if (existing && !intraDups[position]) {
      errors[position] = errors[position] || [];
      const msg = `"${words[idx].word}" was already registered by ${existing.submittedBy.displayName} on ${existing.createdAt.toISOString().split("T")[0]}.`;
      errors[position].push(msg);
      duplicateInfos.push({
        position,
        word: words[idx].word,
        normalizedWord: nw,
        originalDate: existing.createdAt.toISOString().split("T")[0],
        originalContributor: existing.submittedBy.displayName,
        message: msg,
      });
    }
  });

  const isValid = Object.keys(errors).length === 0;

  return NextResponse.json({
    success: true,
    data: {
      isValid,
      errors,
      duplicates: duplicateInfos,
    },
  });
}
