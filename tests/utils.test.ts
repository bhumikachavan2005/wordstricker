import {
  capitalize,
  truncate,
  levelFromXp,
  getProgressColor,
} from "../src/lib/utils";

describe("Shared Utilities", () => {
  describe("capitalize", () => {
    it("should capitalize the first character", () => {
      expect(capitalize("vinuu")).toBe("Vinuu");
      expect(capitalize("bhuu")).toBe("Bhuu");
      expect(capitalize("")).toBe("");
    });
  });

  describe("truncate", () => {
    it("should truncate long strings with ellipsis", () => {
      expect(truncate("Hello world", 8)).toBe("Hello...");
      expect(truncate("Short", 10)).toBe("Short");
    });
  });

  describe("levelFromXp", () => {
    it("should calculate correct level and progress from XP", () => {
      // 0 XP -> Level 1, progress 0
      expect(levelFromXp(0)).toEqual({
        level: 1,
        progress: 0,
        nextLevelXp: 500,
      });

      // 450 XP -> Level 1, progress 450
      expect(levelFromXp(450)).toEqual({
        level: 1,
        progress: 450,
        nextLevelXp: 500,
      });

      // 500 XP -> Level 2, progress 0
      expect(levelFromXp(500)).toEqual({
        level: 2,
        progress: 0,
        nextLevelXp: 500,
      });

      // 1250 XP -> Level 3, progress 250
      expect(levelFromXp(1250)).toEqual({
        level: 3,
        progress: 250,
        nextLevelXp: 500,
      });
    });
  });

  describe("getProgressColor", () => {
    it("should return emerald for high progress", () => {
      expect(getProgressColor(85)).toBe("text-emerald-400");
    });

    it("should return amber for medium progress", () => {
      expect(getProgressColor(60)).toBe("text-amber-400");
    });

    it("should return red for low progress", () => {
      expect(getProgressColor(20)).toBe("text-red-400");
    });
  });
});
