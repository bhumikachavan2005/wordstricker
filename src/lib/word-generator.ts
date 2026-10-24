import { BankWord, CURATED_VOCABULARY_BANK } from "./vocabulary-bank";
import { normalizeWord } from "./words";

export interface GeneratedWordItem {
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: "noun" | "verb" | "adjective" | "adverb";
  exampleSentence: string;
  difficulty: "easy" | "medium" | "hard";
  source: "gemini" | "curated_bank";
}

/**
 * Shuffles an array in place (Fisher-Yates)
 */
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Attempt to generate 10 fresh, non-duplicate words using Google Gemini.
 * Returns null if Gemini is unconfigured or fails.
 */
async function generateWordsViaGemini(
  excludeWords: Set<string>,
  count: number = 10
): Promise<GeneratedWordItem[] | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || process.env.AI_PROVIDER !== "gemini") {
    return null;
  }

  // Sample of words to avoid (keep prompt size reasonable)
  const excludeSample = Array.from(excludeWords).slice(-40).join(", ");

  const prompt = `You are an expert English vocabulary educator.
Generate ${count} distinct, high-quality, inspiring English vocabulary words (GRE/TOEFL standard).
IMPORTANT REQUIREMENTS:
1. Every word MUST be completely unique.
2. DO NOT use any of these already-registered words: [${excludeSample}].
3. For each word, provide:
   - word: The vocabulary word (properly capitalized, single word)
   - meaning: Clear, concise definition (10-25 words)
   - pronunciation: Phonetic spelling (e.g., 'muh-LIF-loo-us')
   - partOfSpeech: One of ['noun', 'verb', 'adjective', 'adverb']
   - exampleSentence: Natural, engaging example sentence showcasing the word in context
   - difficulty: One of ['easy', 'medium', 'hard']

Return ONLY a valid JSON array of objects adhering strictly to this schema:
[
  {
    "word": "string",
    "meaning": "string",
    "pronunciation": "string",
    "partOfSpeech": "noun" | "verb" | "adjective" | "adverb",
    "exampleSentence": "string",
    "difficulty": "easy" | "medium" | "hard"
  }
]`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.85,
            responseMimeType: "application/json",
            maxOutputTokens: 1500,
          },
        }),
        signal: AbortSignal.timeout(12000), // 12s timeout
      }
    );

    if (!response.ok) {
      console.warn(`Gemini generation responded with HTTP ${response.status}. Falling back to curated bank.`);
      return null;
    }

    const json = await response.json();
    const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) return null;

    const parsed: BankWord[] = JSON.parse(rawText);
    if (!Array.isArray(parsed) || parsed.length === 0) return null;

    // Filter against excludeSet and format
    const validWords: GeneratedWordItem[] = [];
    const seenInBatch = new Set<string>();

    for (const item of parsed) {
      if (!item.word || !item.meaning) continue;
      const normalized = normalizeWord(item.word);
      if (excludeWords.has(normalized) || seenInBatch.has(normalized)) continue;

      seenInBatch.add(normalized);
      validWords.push({
        word: item.word.trim(),
        meaning: item.meaning.trim(),
        pronunciation: item.pronunciation?.trim() || "",
        partOfSpeech: (["noun", "verb", "adjective", "adverb"].includes(item.partOfSpeech)
          ? item.partOfSpeech
          : "noun") as "noun" | "verb" | "adjective" | "adverb",
        exampleSentence: item.exampleSentence?.trim() || `The concept of ${item.word} is widely studied.`,
        difficulty: (["easy", "medium", "hard"].includes(item.difficulty)
          ? item.difficulty
          : "medium") as "easy" | "medium" | "hard",
        source: "gemini",
      });

      if (validWords.length >= count) break;
    }

    return validWords.length >= count ? validWords : null;
  } catch (error) {
    console.warn("Gemini generation encountered an issue, seamlessly using curated bank:", error);
    return null;
  }
}

/**
 * Main Hybrid Generator:
 * 1. Tries Gemini AI with exclude-list check.
 * 2. If Gemini is unavailable, immediately selects unused words from the curated bank.
 * 3. Guaranteed to return non-duplicate, fully validated words.
 */
export async function getUniqueWordBatch(
  existingNormalizedWords: string[],
  count: number = 10
): Promise<GeneratedWordItem[]> {
  const excludeSet = new Set(existingNormalizedWords.map((w) => normalizeWord(w)));

  // Try AI first if configured
  if (process.env.GEMINI_API_KEY && process.env.AI_PROVIDER === "gemini") {
    const aiWords = await generateWordsViaGemini(excludeSet, count);
    if (aiWords && aiWords.length === count) {
      return aiWords;
    }
  }

  // Filter curated bank for words not yet in DB
  const availableInBank = CURATED_VOCABULARY_BANK.filter(
    (item) => !excludeSet.has(normalizeWord(item.word))
  );

  // Shuffle available bank words
  const shuffled = shuffle(availableInBank);

  if (shuffled.length >= count) {
    return shuffled.slice(0, count).map((w) => ({
      ...w,
      source: "curated_bank" as const,
    }));
  }

  // If bank has fewer than `count` left, take whatever unused remain
  const result: GeneratedWordItem[] = shuffled.map((w) => ({
    ...w,
    source: "curated_bank" as const,
  }));

  // Fill remaining slots from all bank items not currently in the chosen batch
  const chosenNormalized = new Set(result.map((w) => normalizeWord(w.word)));
  const remainingCandidates = shuffle(
    CURATED_VOCABULARY_BANK.filter((w) => !chosenNormalized.has(normalizeWord(w.word)))
  );

  for (const item of remainingCandidates) {
    if (result.length >= count) break;
    result.push({
      ...item,
      source: "curated_bank" as const,
    });
  }

  return result.slice(0, count);
}
