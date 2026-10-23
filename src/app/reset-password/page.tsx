"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Lock,
  Check,
  X,
} from "lucide-react";
import { Suspense } from "react";
import { evaluatePasswordStrength } from "@/lib/password";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUser = (searchParams.get("user") as "vinuu" | "bhuu") || "vinuu";

  const [username, setUsername] = useState<"vinuu" | "bhuu">(initialUser);
  const [authMethod, setAuthMethod] = useState<"recoveryKey" | "currentPassword">("recoveryKey");
  const [verificationKey, setVerificationKey] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const strength = evaluatePasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (authMethod === "recoveryKey" && !verificationKey.trim()) {
      setError("Please enter your Master Recovery Key.");
      return;
    }

    if (authMethod === "currentPassword" && !currentPassword.trim()) {
      setError("Please enter your Current Password.");
      return;
    }

    if (!strength.valid) {
      setError(`Password must meet all security requirements: ${strength.errors.join(", ")}`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          newPassword,
          verificationKey: authMethod === "recoveryKey" ? verificationKey.trim() : undefined,
          currentPassword: authMethod === "currentPassword" ? currentPassword : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Password for ${username === "vinuu" ? "Vinuu" : "Bhuu"} has been securely updated!`);
        setTimeout(() => {
          router.push(`/login/${username}`);
        }, 1800);
      } else {
        setError(data.error || "Failed to reset password.");
      }
    } catch (e) {
      console.error(e);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isVinuu = username === "vinuu";
  const btnClass = isVinuu ? "btn-primary-vinuu" : "btn-primary-bhuu";

  const getStrengthBarColor = () => {
    if (strength.score <= 1) return "bg-red-500";
    if (strength.score === 2) return "bg-amber-500";
    if (strength.score === 3) return "bg-yellow-400";
    return "bg-emerald-500";
  };

  return (
    <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-4 py-8">
      <div className="glass-card p-6 sm:p-8 w-full max-w-lg mx-auto shadow-2xl border-gray-800 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-white">
            Secure Password Reset
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Strong authentication required to update account credentials
          </p>
        </div>

        {/* Account Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/80 rounded-xl border border-gray-800 mb-5">
          <button
            type="button"
            onClick={() => setUsername("vinuu")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              isVinuu
                ? "bg-violet-600 text-white shadow-md shadow-violet-500/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>💜</span> Vinuu
          </button>
          <button
            type="button"
            onClick={() => setUsername("bhuu")}
            className={`py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              !isVinuu
                ? "bg-amber-500 text-black shadow-md shadow-amber-500/30"
                : "text-gray-400 hover:text-gray-200"
            }`}
          >
            <span>🧡</span> Bhuu
          </button>
        </div>

        {/* Verification Method Selection */}
        <div className="mb-5">
          <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Verification Method
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setAuthMethod("recoveryKey")}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                authMethod === "recoveryKey"
                  ? "border-violet-500/60 bg-violet-950/30 text-violet-200"
                  : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700"
              }`}
            >
              <KeyRound className="w-4 h-4 text-violet-400 shrink-0" />
              <span>Master Recovery Key</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMethod("currentPassword")}
              className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all flex items-center gap-2 ${
                authMethod === "currentPassword"
                  ? "border-amber-500/60 bg-amber-950/30 text-amber-200"
                  : "border-gray-800 bg-gray-900/40 text-gray-400 hover:border-gray-700"
              }`}
            >
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Current Password</span>
            </button>
          </div>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 flex items-center gap-2 text-red-300 text-xs bg-red-950/60 border border-red-500/40 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-center gap-2 text-emerald-300 text-xs bg-emerald-950/60 border border-emerald-500/40 rounded-xl p-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success} Redirecting to login...</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Verification Input */}
          {authMethod === "recoveryKey" ? (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Master Recovery Key <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={verificationKey}
                onChange={(e) => setVerificationKey(e.target.value)}
                placeholder="Enter Universal Master Key or Recovery Passcode"
                className="input-field text-sm"
                required
              />
              <span className="text-[10px] text-gray-500 mt-1 block">
                Use your universal master key (e.g., BuviWordStreak@2024! or BUVI-2024-RECOVERY)
              </span>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Current Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current account password"
                className="input-field text-sm"
                required
              />
            </div>
          )}

          {/* New Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              New Strong Password <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password (min 8 chars)"
                className="input-field pr-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Live Strength Meter */}
            {newPassword && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-400">Strength:</span>
                  <span
                    className={`font-bold ${
                      strength.score <= 1
                        ? "text-red-400"
                        : strength.score === 2
                        ? "text-amber-400"
                        : strength.score === 3
                        ? "text-yellow-400"
                        : "text-emerald-400"
                    }`}
                  >
                    {strength.label}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                  <div
                    className={`h-full transition-all duration-300 ${getStrengthBarColor()}`}
                    style={{ width: `${(strength.score / 4) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Confirm New Password <span className="text-red-400">*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your new password"
              className="input-field text-sm"
              required
            />
          </div>

          {/* Password Requirements Checklist */}
          <div className="p-3 bg-gray-900/60 rounded-xl border border-gray-800/80 space-y-1.5 text-[11px]">
            <span className="font-semibold text-gray-300 block mb-1">
              Security Requirements:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-400">
              <div className="flex items-center gap-1.5">
                {strength.rules.minLength ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span className={strength.rules.minLength ? "text-emerald-300" : ""}>
                  At least 8 characters
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {strength.rules.hasUppercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span className={strength.rules.hasUppercase ? "text-emerald-300" : ""}>
                  One uppercase letter (A-Z)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {strength.rules.hasLowercase ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span className={strength.rules.hasLowercase ? "text-emerald-300" : ""}>
                  One lowercase letter (a-z)
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {strength.rules.hasNumber ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span className={strength.rules.hasNumber ? "text-emerald-300" : ""}>
                  At least one number (0-9)
                </span>
              </div>
              <div className="flex items-center gap-1.5 sm:col-span-2">
                {strength.rules.hasSpecial ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <X className="w-3.5 h-3.5 text-gray-600" />
                )}
                <span className={strength.rules.hasSpecial ? "text-emerald-300" : ""}>
                  One special symbol (!@#$%^&*)
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword || !strength.valid}
            className={`btn ${btnClass} w-full py-3 text-sm font-bold mt-2 shadow-lg hover-lift disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? "Verifying & Updating..." : "Save Strong Password"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href={`/login/${username}`}
            className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
