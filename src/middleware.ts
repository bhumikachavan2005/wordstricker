import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const { auth } = NextAuth(authConfig);

export default auth((req: NextRequest & { auth: unknown }) => {
  const isAuthenticated = !!(req as { auth?: { user?: unknown } }).auth?.user;
  const pathname = req.nextUrl.pathname;

  // Paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/learn",
    "/quiz",
    "/vault",
    "/history",
    "/achievements",
    "/settings",
    "/api/dashboard",
    "/api/words",
    "/api/progress",
    "/api/quiz",
    "/api/vault",
    "/api/achievements",
    "/api/ai",
    "/api/notifications",
  ];

  const isProtected = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtected && !isAuthenticated) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from login pages
  if (isAuthenticated && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts|images).*)",
  ],
};
