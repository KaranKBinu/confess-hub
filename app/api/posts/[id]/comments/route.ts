import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  const { id } = context.params;
  try {
    const comments = await prisma.comment.findMany({
      where: { postId: id, post: { status: "APPROVED" } },
      select: {
        id: true,
        content: true,
        createdAt: true,
        user: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    });
    return NextResponse.json(comments, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Comments are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });

  const { id } = context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Write a comment before posting." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("content" in payload)) {
    return NextResponse.json({ error: "Write a comment before posting." }, { status: 400 });
  }
  const content = (payload as { content?: unknown }).content;
  if (typeof content !== "string" || !content.trim() || content.trim().length > 1000) {
    return NextResponse.json({ error: "Comments must be between 1 and 1,000 characters." }, { status: 400 });
  }

  try {
    const post = await prisma.post.findFirst({ where: { id, status: "APPROVED" }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    const comment = await prisma.comment.create({
      data: { postId: id, userId: user.id, content: content.trim() },
      select: { id: true, content: true, createdAt: true, user: { select: { username: true, displayName: true } } },
    });
    return NextResponse.json(comment, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Comments are temporarily unavailable." }, { status: 503 });
  }
}
