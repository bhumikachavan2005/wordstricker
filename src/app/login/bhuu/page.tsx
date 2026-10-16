import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login as Bhuu",
  description: "Sign in to WordStreak as Bhuu",
};

export default function BhuuLoginPage() {
  return (
    <main className="animated-bg min-h-screen flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-6 block">
            <span>←</span> Back to home
          </Link>
          <div className="text-5xl mb-2">🔥</div>
          <h1 className="text-2xl font-bold font-outfit gradient-text-streak">WordStreak</h1>
        </div>

        <Suspense fallback={<div className="glass-card p-8 h-72 skeleton" />}>
          <LoginForm username="bhuu" />
        </Suspense>

        <p className="text-center text-gray-600 text-xs mt-6">
          Are you Vinuu?{" "}
          <Link href="/login/vinuu" className="text-violet-400 hover:text-violet-300">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
