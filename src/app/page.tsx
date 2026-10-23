import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Zap, BookOpen, Trophy, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="animated-bg min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo area */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-linear-to-br from-violet-600 to-purple-800 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-3xl animate-flicker">🔥</span>
          </div>
          <div className="text-left">
            <h1 className="text-4xl font-bold font-outfit gradient-text-streak">
              WordStreak
            </h1>
            <p className="text-gray-400 text-sm font-medium">Vinuu &amp; Bhuu&apos;s Vocabulary Challenge</p>
          </div>
        </div>

        <p className="text-gray-300 text-lg max-w-md mx-auto leading-relaxed">
          Build your English vocabulary together, <br />
          one word at a time — every single day.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-2 gap-4 mb-10 max-w-sm w-full animate-fade-in-up" style={{animationDelay: "0.1s"}}>
        {[
          { icon: BookOpen, label: "10 words daily", color: "text-violet-400" },
          { icon: Zap, label: "Daily streaks", color: "text-amber-400" },
          { icon: Trophy, label: "Achievements", color: "text-emerald-400" },
          { icon: Users, label: "2-player challenge", color: "text-pink-400" },
        ].map(({ icon: Icon, label, color }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <Icon className={`w-5 h-5 ${color}`} />
            <span className="text-sm text-gray-300 font-medium">{label}</span>
          </div>
        ))}
      </div>

      {/* Login options */}
      <div className="flex flex-col gap-4 w-full max-w-sm animate-fade-in-up" style={{animationDelay: "0.2s"}}>
        <Link
          href="/login/vinuu"
          id="login-vinuu"
          className="btn btn-primary-vinuu py-4 text-base rounded-xl hover-lift"
        >
          <span className="text-lg">💜</span>
          Login as Vinuu
        </Link>

        <Link
          href="/login/bhuu"
          id="login-bhuu"
          className="btn btn-primary-bhuu py-4 text-base rounded-xl hover-lift"
        >
          <span className="text-lg">🧡</span>
          Login as Bhuu
        </Link>

        <Link
          href="/login"
          id="login-shared"
          className="btn btn-ghost py-3 text-sm rounded-xl"
        >
          Choose your account
        </Link>
      </div>

      <p className="text-gray-600 text-xs mt-8">
        Private platform for Vinuu &amp; Bhuu only
      </p>
    </main>
  );
}
