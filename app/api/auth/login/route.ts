import { NextRequest, NextResponse } from "next/server";
import { assertAuthConfigured, createSession, isTrustedSameOrigin, normalizeEmail, verifyPassword } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

export async function POST(request: NextRequest) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 8_000) {
    return NextResponse.json({ error: "The request is too large." }, { status: 413 });
  }
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Enter your email and password." }, { status: 400 });
  }

  const { email, password } = payload as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || typeof password !== "string" || password.length > 128) {
    return NextResponse.json({ error: "Email or password is incorrect." }, { status: 400 });
  }

  try {
    assertAuthConfigured();
    const user = await prisma.user.findUnique({ where: { email: normalizeEmail(email) } });
    const valid = user ? await verifyPassword(password, user.passwordHash) : false;
    if (!user || !valid) {
      return NextResponse.json({ error: "Email or password is incorrect." }, { status: 401 });
    }

    const safeUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      showUsernameOnPosts: user.showUsernameOnPosts,
      themePreference: user.themePreference === "dark" ? "dark" as const : "light" as const,
    };
    const response = NextResponse.json({ user: safeUser });
    await createSession(response, safeUser);
    return response;
  } catch {
    return NextResponse.json({ error: "Sign in is temporarily unavailable." }, { status: 503 });
  }
}
