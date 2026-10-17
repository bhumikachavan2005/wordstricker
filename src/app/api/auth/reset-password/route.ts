import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const ResetSchema = z.object({
  username: z.enum(["vinuu", "bhuu"]),
  newPassword: z.string().min(4, "Password must be at least 4 characters long"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ResetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { username, newPassword } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    // Hash the new password with bcrypt
    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
      where: { username },
      data: { passwordHash },
    });

    return NextResponse.json({
      success: true,
      message: `Password for @${username} has been successfully reset!`,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    const message = error instanceof Error ? error.message : "Failed to reset password";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
