import { areConsecutiveDays, getLastNDates } from "../src/lib/dates";

describe("Date Utilities & Streak Logic", () => {
  describe("areConsecutiveDays", () => {
    it("should return true for consecutive calendar dates", () => {
      expect(areConsecutiveDays("2026-10-15", "2026-10-16")).toBe(true);
      expect(areConsecutiveDays("2026-10-16", "2026-10-15")).toBe(true);
      expect(areConsecutiveDays("2026-02-28", "2026-03-01")).toBe(true);
    });

    it("should return false for the same day", () => {
      expect(areConsecutiveDays("2026-10-16", "2026-10-16")).toBe(false);
    });

    it("should return false for skipped days", () => {
      expect(areConsecutiveDays("2026-10-14", "2026-10-16")).toBe(false);
      expect(areConsecutiveDays("2026-10-10", "2026-10-12")).toBe(false);
    });
  });

  describe("getLastNDates", () => {
    it("should return N dates ending with today", () => {
      const dates = getLastNDates(7, "UTC");
      expect(dates.length).toBe(7);
      // verify sorted ascending
      for (let i = 0; i < dates.length - 1; i++) {
        expect(dates[i] < dates[i + 1]).toBe(true);
      }
    });
  });
});
