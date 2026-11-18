import { NextRequest, NextResponse } from "next/server";
import { assertAuthConfigured, createSession, hashPassword, isTrustedSameOrigin, normalizeEmail } from "@/lib/auth";
import prisma from "@/lib/prismaClient";
import { displayNameFromUsername, generateUsername, isValidUsername, normalizeUsername } from "@/lib/username";

async function pickAvailableUsername(preferred?: string): Promise<string> {
  const candidates: string[] = [];
  if (preferred) candidates.push(preferred);
  for (let attempt = 0; attempt < 12; attempt += 1) {
    candidates.push(generateUsername());
  }

  for (const candidate of candidates) {
    const existing = await prisma.user.findUnique({ where: { username: candidate }, select: { id: true } });
    if (!existing) return candidate;
  }
  return `${generateUsername()}_${Date.now().toString(36).slice(-4)}`.slice(0, 30);
}

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter your account details to continue." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Enter your account details to continue." }, { status: 400 });
  }

  const { email, password, displayName, username } = payload as {
    email?: unknown;
    password?: unknown;
    displayName?: unknown;
    username?: unknown;
  };
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 320) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return NextResponse.json({ error: "Use a password between 12 and 128 characters." }, { status: 400 });
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_000) {
    return NextResponse.json({ error: "The request is too large." }, { status: 413 });
  }

  let normalizedUsername: string | undefined;
  if (username !== undefined && username !== null && String(username).trim() !== "") {
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Usernames must be text." }, { status: 400 });
    }
    normalizedUsername = normalizeUsername(username);
    if (!isValidUsername(normalizedUsername)) {
      return NextResponse.json({
        error: "Usernames must be 3–30 characters: lowercase letters, numbers, and underscores; start with a letter.",
      }, { status: 400 });
    }
  }

  let resolvedDisplayName: string;
  if (typeof displayName === "string" && displayName.trim().length >= 2 && displayName.trim().length <= 40) {
    resolvedDisplayName = displayName.trim();
  } else if (normalizedUsername) {
    resolvedDisplayName = displayNameFromUsername(normalizedUsername);
  } else {
    resolvedDisplayName = "Community member";
  }

  const normalizedEmail = normalizeEmail(email);
  try {
    assertAuthConfigured();
    const chosenUsername = await pickAvailableUsername(normalizedUsername);
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        username: chosenUsername,
        displayName: resolvedDisplayName,
        passwordHash: await hashPassword(password),
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        showUsernameOnPosts: true,
        themePreference: true,
      },
    });
    const sessionUser = {
      ...user,
      themePreference: user.themePreference === "dark" ? "dark" as const : "light" as const,
    };
    const response = NextResponse.json({ user: sessionUser }, { status: 201 });
    await createSession(response, sessionUser);
    return response;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "An account with that email or username already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: "Sign up is temporarily unavailable." }, { status: 503 });
  }
}