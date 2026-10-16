"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";

interface LoginFormProps {
  username: "vinuu" | "bhuu";
}

export function LoginForm({ username }: LoginFormProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const isVinuu = username === "vinuu";
  const displayName = isVinuu ? "Vinuu" : "Bhuu";
  const emoji = isVinuu ? "💜" : "🧡";
  const btnClass = isVinuu ? "btn-primary-vinuu" : "btn-primary-bhuu";
  const focusClass = isVinuu ? "" : "bhuu-focus";
  const accentText = isVinuu ? "gradient-text-vinuu" : "gradient-text-bhuu";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Incorrect password. Please try again.");
      setLoading(false);
    } else {
      router.push(callbackUrl);
      router.refresh();
    }
  }

  return (
    <div className="glass-card p-8 w-full max-w-md mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-5xl mb-4">{emoji}</div>
        <h2 className={`text-2xl font-bold font-outfit ${accentText}`}>
          Welcome back, {displayName}
        </h2>
        <p className="text-gray-400 text-sm mt-1">
          Enter your password to continue learning
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Username (read-only display) */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Account
          </label>
          <div className="input-field bg-gray-900/50 text-gray-400 cursor-not-allowed">
            @{username}
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              htmlFor="login-password"
              className="text-sm font-medium text-gray-300"
            >
              Password
            </label>
            <Link
              href={`/reset-password?user=${username}`}
              className={`text-xs ${isVinuu ? "text-violet-400 hover:text-violet-300" : "text-amber-400 hover:text-amber-300"} transition-colors`}
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`input-field pr-12 ${focusClass}`}
              placeholder="Enter your password"
              required
              autoComplete="current-password"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm bg-red-950/50 border border-red-500/30 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Submit */}
        <button
          id={`submit-login-${username}`}
          type="submit"
          disabled={loading || !password}
          className={`btn ${btnClass} w-full py-3.5 text-base`}
        >
          {loading ? (
            <span className="inline-flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Logging in...
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <LogIn className="w-4 h-4" />
              Login as {displayName}
            </span>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link href="/login" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
          ← Back to account selection
        </Link>
      </div>
    </div>
  );
}
