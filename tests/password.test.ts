import { evaluatePasswordStrength } from "../src/lib/password";

describe("Password Strength & Validation", () => {
  it("should reject passwords that are too short", () => {
    const res = evaluatePasswordStrength("Ab1!");
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("At least 8 characters long");
  });

  it("should reject passwords without uppercase letters", () => {
    const res = evaluatePasswordStrength("password123!");
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("At least one uppercase letter (A-Z)");
  });

  it("should reject passwords without lowercase letters", () => {
    const res = evaluatePasswordStrength("PASSWORD123!");
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("At least one lowercase letter (a-z)");
  });

  it("should reject passwords without numbers", () => {
    const res = evaluatePasswordStrength("Password!@#$");
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("At least one number (0-9)");
  });

  it("should reject passwords without special characters", () => {
    const res = evaluatePasswordStrength("Password123");
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("At least one special symbol (!@#$%^&*)");
  });

  it("should accept compliant strong passwords", () => {
    const res = evaluatePasswordStrength("WordStreak@Vinuu2024");
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
    expect(res.label).toBe("Strong");
    expect(res.score).toBe(4);
  });
});
