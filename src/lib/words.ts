/**
 * Word normalization utilities.
 * Normalizing consistently ensures the zero-duplicate rule is enforced.
 *
 * Strategy: trim whitespace + lowercase
 *   - Handles: "Meticulous" == "meticulous" == " METICULOUS "
 *   - Does NOT merge: "affect" ≠ "effect" (different spellings)
 *   - Does NOT strip punctuation — "self-control" ≠ "selfcontrol"
 */

export function normalizeWord(word: string): string {
  return word.trim().toLowerCase();
}

/**
 * Validate a single word string (before normalization).
 */
export function validateWordString(word: string): {
  valid: boolean;
  error?: string;
} {
  const trimmed = word.trim();

  if (!trimmed) {
    return { valid: false, error: "Word cannot be empty." };
  }

  if (trimmed.length < 2) {
    return { valid: false, error: "Word must be at least 2 characters." };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: "Word must be 100 characters or fewer." };
  }

  // Allow letters, hyphens, apostrophes (e.g., "self-aware", "it's")
  if (!/^[a-zA-Z][a-zA-Z\s\-']*$/.test(trimmed)) {
    return {
      valid: false,
      error: "Word may only contain letters, hyphens, and apostrophes.",
    };
  }

  return { valid: true };
}

/**
 * Check for intra-submission duplicates (before hitting the DB).
 * Returns an object mapping position (1-indexed) to duplicate of position.
 */
export function findIntraSubmissionDuplicates(
  words: string[]
): Record<number, number> {
  const seen = new Map<string, number>(); // normalizedWord -> first position (1-indexed)
  const duplicates: Record<number, number> = {};

  words.forEach((word, idx) => {
    const normalized = normalizeWord(word);
    const position = idx + 1;

    if (seen.has(normalized)) {
      duplicates[position] = seen.get(normalized)!;
    } else {
      seen.set(normalized, position);
    }
  });

  return duplicates;
}

export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "pronoun"
  | "preposition"
  | "conjunction"
  | "interjection"
  | "determiner"
  | "idiom";

export const PARTS_OF_SPEECH: PartOfSpeech[] = [
  "noun",
  "verb",
  "adjective",
  "adverb",
  "pronoun",
  "preposition",
  "conjunction",
  "interjection",
  "determiner",
  "idiom",
];

export type Difficulty = "easy" | "medium" | "hard";

export const DIFFICULTIES: Difficulty[] = ["easy", "medium", "hard"];

export interface WordFormData {
  word: string;
  meaning: string;
  pronunciation: string;
  partOfSpeech: PartOfSpeech;
  exampleSentence: string;
  difficulty: Difficulty;
}

export const REQUIRED_WORDS_PER_DAY = 10;
