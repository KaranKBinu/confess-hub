import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to react to a story." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });

  const { id } = context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose like or dislike." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("value" in payload)) {
    return NextResponse.json({ error: "Choose like or dislike." }, { status: 400 });
  }
  const value = (payload as { value?: unknown }).value;
  if (value !== "LIKE" && value !== "DISLIKE") return NextResponse.json({ error: "Choose like or dislike." }, { status: 400 });

  try {
    const post = await prisma.post.findFirst({ where: { id, status: "APPROVED" }, select: { id: true } });
    if (!post) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });

    const existing = await prisma.vote.findUnique({ where: { postId_userId: { postId: id, userId: user.id } } });
    if (existing?.value === value) {
      await prisma.vote.delete({ where: { id: existing.id } });
    } else {
      await prisma.vote.upsert({
        where: { postId_userId: { postId: id, userId: user.id } },
        update: { value },
        create: { postId: id, userId: user.id, value },
      });
    }
    return NextResponse.json({ value: existing?.value === value ? null : value });
  } catch {
    return NextResponse.json({ error: "Reactions are temporarily unavailable." }, { status: 503 });
  }
}
