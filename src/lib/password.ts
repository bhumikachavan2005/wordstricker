/**
 * Password strength and validation utilities for WordStreak
 */

export interface PasswordStrengthResult {
  valid: boolean;
  score: number; // 0 to 4
  label: "Very Weak" | "Weak" | "Fair" | "Good" | "Strong";
  errors: string[];
  rules: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const rules = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[^A-Za-z0-9]/.test(password),
  };

  const errors: string[] = [];
  if (!rules.minLength) errors.push("At least 8 characters long");
  if (!rules.hasUppercase) errors.push("At least one uppercase letter (A-Z)");
  if (!rules.hasLowercase) errors.push("At least one lowercase letter (a-z)");
  if (!rules.hasNumber) errors.push("At least one number (0-9)");
  if (!rules.hasSpecial) errors.push("At least one special symbol (!@#$%^&*)");

  // Calculate score (0-4)
  let score = 0;
  if (rules.minLength) score += 1;
  if (rules.hasUppercase && rules.hasLowercase) score += 1;
  if (rules.hasNumber) score += 1;
  if (rules.hasSpecial) score += 1;

  let label: PasswordStrengthResult["label"] = "Very Weak";
  if (score === 1) label = "Weak";
  else if (score === 2) label = "Fair";
  else if (score === 3) label = "Good";
  else if (score >= 4) label = "Strong";

  const valid = errors.length === 0;

  return {
    valid,
    score,
    label,
    errors,
    rules,
  };
}
