import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Login as Vinuu",
  description: "Sign in to WordStreak as Vinuu",
};

export default function VinuuLoginPage() {
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
          <LoginForm username="vinuu" />
        </Suspense>

        <p className="text-center text-gray-600 text-xs mt-6">
          Are you Bhuu?{" "}
          <Link href="/login/bhuu" className="text-amber-500 hover:text-amber-400">
            Login here
          </Link>
        </p>
      </div>
    </main>
  );
}
