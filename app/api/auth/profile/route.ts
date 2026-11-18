import { NextRequest, NextResponse } from "next/server";
import { createSession, getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import prisma from "@/lib/prismaClient";
import { isValidUsername, normalizeUsername } from "@/lib/username";
import { isThemePreference } from "@/lib/theme";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view your profile." }, { status: 401 });

  try {
    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        role: true,
        showUsernameOnPosts: true,
        themePreference: true,
        createdAt: true,
        _count: { select: { comments: true, posts: true } },
      },
    });
    if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    const { _count, ...rest } = profile;
    const likeCount = await prisma.vote.count({ where: { userId: user.id, value: "LIKE" } });
    return NextResponse.json({
      user: {
        ...rest,
        themePreference: rest.themePreference === "dark" ? "dark" : "light",
        commentCount: _count.comments,
        likeCount,
        postCount: _count.posts,
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Profile is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to update your profile." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send profile updates as JSON." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Send profile updates as JSON." }, { status: 400 });
  }

  const { username, displayName, showUsernameOnPosts, themePreference } = payload as {
    username?: unknown;
    displayName?: unknown;
    showUsernameOnPosts?: unknown;
    themePreference?: unknown;
  };
  const updates: {
    username?: string;
    displayName?: string;
    showUsernameOnPosts?: boolean;
    themePreference?: string;
  } = {};

  if (username !== undefined) {
    if (typeof username !== "string") {
      return NextResponse.json({ error: "Usernames must be text." }, { status: 400 });
    }
    const normalized = normalizeUsername(username);
    if (!isValidUsername(normalized)) {
      return NextResponse.json({
        error: "Usernames must be 3–30 characters: lowercase letters, numbers, and underscores; start with a letter.",
      }, { status: 400 });
    }
    updates.username = normalized;
  }

  if (displayName !== undefined) {
    if (typeof displayName !== "string" || displayName.trim().length < 2 || displayName.trim().length > 40) {
      return NextResponse.json({ error: "Display names must be 2–40 characters." }, { status: 400 });
    }
    updates.displayName = displayName.trim();
  }

  if (showUsernameOnPosts !== undefined) {
    if (typeof showUsernameOnPosts !== "boolean") {
      return NextResponse.json({ error: "Username visibility must be true or false." }, { status: 400 });
    }
    updates.showUsernameOnPosts = showUsernameOnPosts;
  }

  if (themePreference !== undefined) {
    if (!isThemePreference(themePreference)) {
      return NextResponse.json({ error: "Theme must be light or dark." }, { status: 400 });
    }
    updates.themePreference = themePreference;
  }

  if (!updates.username && !updates.displayName && updates.showUsernameOnPosts === undefined && !updates.themePreference) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: updates,
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
      ...updated,
      themePreference: updated.themePreference === "dark" ? "dark" as const : "light" as const,
    };
    const response = NextResponse.json({ user: sessionUser });
    await createSession(response, sessionUser);
    return response;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
    return NextResponse.json({ error: "Profile is temporarily unavailable." }, { status: 503 });
  }
}