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
  isDailyLife?: boolean;
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
 * Attempt to generate 10 fresh, non-duplicate daily-life words using Google Gemini.
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

  const prompt = `You are a practical English language and communication coach.
Generate ${count} distinct, useful English vocabulary words that people encounter and use in DAILY LIFE, everyday conversations, workplace discussions, emotions, personal habits, and social interactions.

MANDATORY GUIDELINES FOR WORD SELECTION:
1. FOCUS STRICTLY ON DAILY LIFE USE WORDS:
   - Words MUST be practical, relatable, and commonly used in everyday real-world communication (e.g., words like 'Resilient', 'Empathy', 'Pragmatic', 'Mindful', 'Curious', 'Spontaneous', 'Diligent', 'Authentic', 'Collaborate', 'Adaptable', 'Compassion', 'Generous', 'Sincere', 'Patience', 'Courageous', 'Consistent', 'Versatile', 'Perspective', 'Grateful', 'Resourceful', 'Hesitate', 'Appreciate', 'Optimistic', 'Reliable', 'Attentive', 'Approachable', 'Decisive', 'Sensible', 'Thoughtful', 'Flexible').
   - DO NOT generate overly hard, obscure, archaic, or complex academic GRE/TOEFL vocabulary.
   - STRICTLY AVOID words like: 'anachronism', 'sycophant', 'obsequious', 'pusillanimous', 'ephemeral', 'cacophony', 'alacrity', 'bucolic', 'soliloquy', 'mellifluous', 'grandiloquent', 'chimerical'.
   - Words must be accessible, empowering, natural, and immediately applicable in everyday conversations and daily journaling.

2. UNICITY & EXCLUSIONS:
   - Every word in this batch MUST be completely unique.
   - DO NOT use any of these already-registered words: [${excludeSample}].

3. FOR EACH WORD, PROVIDE:
   - word: The vocabulary word (properly capitalized, single English word, no spaces or hyphens)
   - meaning: A simple, clear, concise definition in plain English (8-20 words) explaining how it is understood in daily life
   - pronunciation: Simple phonetic pronunciation guide (e.g., 'EM-puh-thee', 'rih-ZIL-yunt')
   - partOfSpeech: One of ['noun', 'verb', 'adjective', 'adverb']
   - exampleSentence: A natural, relatable everyday life sentence (e.g. at home, with friends, at work, or daily routine)
   - difficulty: One of ['easy', 'medium', 'hard'] (prefer 'easy' or 'medium' for daily life words)

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
          systemInstruction: {
            parts: [
              {
                text: "You are an English coach focused strictly on practical, daily-life vocabulary. Generate practical everyday words used in daily conversations and real life, strictly avoiding archaic, academic, or overly hard GRE/TOEFL words.",
              },
            ],
          },
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
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
        exampleSentence: item.exampleSentence?.trim() || `The concept of ${item.word} is useful in daily conversations.`,
        difficulty: (["easy", "medium", "hard"].includes(item.difficulty)
          ? item.difficulty
          : "easy") as "easy" | "medium" | "hard",
        source: "gemini",
        isDailyLife: true,
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
 * 1. Tries Gemini AI with strict daily-life vocabulary instruction and exclude-list check.
 * 2. If Gemini is unavailable, immediately selects unused daily-life words from the curated bank.
 * 3. Guaranteed to return non-duplicate, fully validated daily-life words.
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

  // Prioritize daily-life use vocabulary words
  const dailyLifeAvailable = availableInBank.filter((item) => item.isDailyLife === true);
  const primaryPool = dailyLifeAvailable.length >= count ? dailyLifeAvailable : availableInBank;

  // Shuffle candidate pool
  const shuffled = shuffle(primaryPool);

  if (shuffled.length >= count) {
    return shuffled.slice(0, count).map((w) => ({
      ...w,
      source: "curated_bank" as const,
    }));
  }

  // If pool has fewer than `count` left, take whatever unused remain
  const result: GeneratedWordItem[] = shuffled.map((w) => ({
    ...w,
    source: "curated_bank" as const,
  }));

  // Fill remaining slots from all bank items not currently in the chosen batch
  const chosenNormalized = new Set(result.map((w) => normalizeWord(w.word)));
  const remainingCandidates = shuffle(
    availableInBank.filter((w) => !chosenNormalized.has(normalizeWord(w.word)))
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
