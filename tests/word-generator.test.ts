import { getUniqueWordBatch } from "../src/lib/word-generator";
import { normalizeWord } from "../src/lib/words";

describe("Hybrid Word Generator", () => {
  it("should generate exactly 10 words", async () => {
    const words = await getUniqueWordBatch([], 10);
    expect(words).toHaveLength(10);
  });

  it("should not contain any excluded words", async () => {
    const exclude = ["alacrity", "anachronism", "ameliorate"];
    const words = await getUniqueWordBatch(exclude, 10);
    const normalizedGenerated = words.map((w) => normalizeWord(w.word));

    for (const ex of exclude) {
      expect(normalizedGenerated).not.toContain(ex);
    }
  });

  it("should produce valid word structures with meaning and exampleSentence", async () => {
    const words = await getUniqueWordBatch([], 5);
    for (const item of words) {
      expect(item.word.length).toBeGreaterThan(0);
      expect(item.meaning.length).toBeGreaterThan(0);
      expect(item.exampleSentence.length).toBeGreaterThan(0);
      expect(["noun", "verb", "adjective", "adverb"]).toContain(item.partOfSpeech);
      expect(["easy", "medium", "hard"]).toContain(item.difficulty);
    }
  });

  it("should produce completely unique words within the batch", async () => {
    const words = await getUniqueWordBatch([], 10);
    const set = new Set(words.map((w) => normalizeWord(w.word)));
    expect(set.size).toBe(10);
  });

  it("should prioritize practical daily life use words", async () => {
    const words = await getUniqueWordBatch([], 10);
    expect(words).toHaveLength(10);
    // Verify that at least one daily life attribute or common practical word is included
    const hasDailyLifeWords = words.some(
      (w) => w.isDailyLife === true || ["easy", "medium"].includes(w.difficulty)
    );
    expect(hasDailyLifeWords).toBe(true);
  });
});
