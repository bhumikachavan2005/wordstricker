import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Login",
  description: "Choose your account to log in to WordStreak",
};

export default function LoginPage() {
  return (
    <main className="animated-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="text-center mb-10">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 block">
          ← Back to home
        </Link>
        <div className="text-5xl mb-4">🔥</div>
        <h1 className="text-3xl font-bold font-outfit gradient-text-streak mb-2">WordStreak</h1>
        <p className="text-gray-400">Choose your account to continue</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-lg">
        {/* Vinuu card */}
        <Link
          href="/login/vinuu"
          id="choose-vinuu"
          className="glass-card flex-1 p-8 text-center hover-lift hover-glow-vinuu transition-all duration-200 group"
        >
          <div className="text-5xl mb-4 group-hover:animate-bounce-subtle">💜</div>
          <h2 className="text-xl font-bold font-outfit gradient-text-vinuu mb-1">Vinuu</h2>
          <p className="text-gray-400 text-sm">@vinuu</p>
          <div className="mt-4 inline-flex items-center gap-2 text-violet-400 text-sm font-medium">
            Login →
          </div>
        </Link>

        {/* Bhuu card */}
        <Link
          href="/login/bhuu"
          id="choose-bhuu"
          className="glass-card flex-1 p-8 text-center hover-lift hover-glow-bhuu transition-all duration-200 group"
        >
          <div className="text-5xl mb-4 group-hover:animate-bounce-subtle">🧡</div>
          <h2 className="text-xl font-bold font-outfit gradient-text-bhuu mb-1">Bhuu</h2>
          <p className="text-gray-400 text-sm">@bhuu</p>
          <div className="mt-4 inline-flex items-center gap-2 text-amber-400 text-sm font-medium">
            Login →
          </div>
        </Link>
      </div>

      <div className="mt-8 text-center space-y-2">
        <Link
          href="/reset-password"
          className="text-xs text-gray-400 hover:text-white transition-colors"
        >
          Forgot password? <span className="text-violet-400 hover:underline">Reset it here</span>
        </Link>
        <p className="text-gray-600 text-xs">
          Private platform for Vinuu &amp; Bhuu only
        </p>
      </div>
    </main>
  );
}
