"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, Eye, EyeOff, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import { Suspense } from "react";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialUser = (searchParams.get("user") as "vinuu" | "bhuu") || "vinuu";

  const [username, setUsername] = useState<"vinuu" | "bhuu">(initialUser);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword.length < 4) {
      setError("Password must be at least 4 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
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
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(`Password for ${username === "vinuu" ? "Vinuu" : "Bhuu"} has been updated!`);
        setTimeout(() => {
          router.push(`/login/${username}`);
        }, 1500);
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

  return (
    <div className="animated-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="glass-card p-8 w-full max-w-md mx-auto shadow-2xl border-gray-800 animate-fade-in-up">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-amber-500 flex items-center justify-center mx-auto mb-3 shadow-md">
            <KeyRound className="w-6 h-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold font-outfit text-white">
            Reset Password
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Choose account and create a new password
          </p>
        </div>

        {/* Account Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-gray-900/80 rounded-xl border border-gray-800 mb-6">
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
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="input-field pr-10 text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Confirm New Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="input-field text-sm"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading || !newPassword || !confirmPassword}
            className={`btn ${btnClass} w-full py-3 text-sm font-bold mt-2 shadow-lg hover-lift`}
          >
            {loading ? "Updating Password..." : "Set New Password"}
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
