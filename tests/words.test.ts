import {
  normalizeWord,
  validateWordString,
  findIntraSubmissionDuplicates,
} from "../src/lib/words";

describe("Word Normalization & Validation", () => {
  describe("normalizeWord", () => {
    it("should trim and convert to lowercase", () => {
      expect(normalizeWord("  Ephemeral  ")).toBe("ephemeral");
      expect(normalizeWord("METICULOUS")).toBe("meticulous");
      expect(normalizeWord("Serendipity\n")).toBe("serendipity");
    });

    it("should preserve hyphens and apostrophes", () => {
      expect(normalizeWord("Self-Control")).toBe("self-control");
      expect(normalizeWord("Cat's-Paw")).toBe("cat's-paw");
    });
  });

  describe("validateWordString", () => {
    it("should accept valid English words", () => {
      expect(validateWordString("soliloquy").valid).toBe(true);
      expect(validateWordString("well-being").valid).toBe(true);
      expect(validateWordString("it's").valid).toBe(true);
    });

    it("should reject empty strings or whitespace", () => {
      expect(validateWordString("").valid).toBe(false);
      expect(validateWordString("   ").valid).toBe(false);
    });

    it("should reject words shorter than 2 characters", () => {
      expect(validateWordString("a").valid).toBe(false);
    });

    it("should reject strings containing numbers or forbidden symbols", () => {
      expect(validateWordString("word123").valid).toBe(false);
      expect(validateWordString("hello@world").valid).toBe(false);
    });
  });

  describe("findIntraSubmissionDuplicates", () => {
    it("should find no duplicates when all words are distinct", () => {
      const words = ["ephemeral", "serendipity", "mellifluous", "soliloquy"];
      const duplicates = findIntraSubmissionDuplicates(words);
      expect(Object.keys(duplicates).length).toBe(0);
    });

    it("should detect duplicate words regardless of casing and spacing", () => {
      const words = [
        "Ephemeral",
        "Serendipity",
        "  ephemeral  ",
        "Mellifluous",
        "SERENDIPITY",
      ];
      const duplicates = findIntraSubmissionDuplicates(words);
      // Word at index 2 (position 3) duplicates position 1
      expect(duplicates[3]).toBe(1);
      // Word at index 4 (position 5) duplicates position 2
      expect(duplicates[5]).toBe(2);
    });
  });
});
