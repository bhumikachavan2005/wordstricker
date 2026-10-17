import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  try {
    const userCount = await prisma.user.count();
    const streak = await prisma.sharedStreak.findFirst({
      select: { currentStreak: true, longestStreak: true },
    });
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      status: "healthy",
      database: "connected",
      latency: `${latencyMs}ms`,
      data: {
        usersCount: userCount,
        streak: streak?.currentStreak ?? 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        status: "unhealthy",
        database: "disconnected",
        latency: `${latencyMs}ms`,
        error: error instanceof Error ? error.message : "Unknown database error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
