import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import { containsBlacklisted } from "@/lib/moderation";
import prisma from "@/lib/prismaClient";

export async function POST(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to add another part." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Write the next part before posting." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("content" in payload)) {
    return NextResponse.json({ error: "Write the next part before posting." }, { status: 400 });
  }
  const content = (payload as { content?: unknown }).content;
  if (typeof content !== "string" || !content.trim() || content.trim().length > 2000) {
    return NextResponse.json({ error: "Each part must be between 1 and 2,000 characters." }, { status: 400 });
  }

  try {
    const anchor = await prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        authorUserId: true,
        status: true,
        language: true,
        anonymousId: true,
        showAuthor: true,
        seriesId: true,
        partIndex: true,
        partTotal: true,
      },
    });
    if (!anchor) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    if (!anchor.authorUserId || anchor.authorUserId !== user.id) {
      return NextResponse.json({ error: "Only the author can add another part." }, { status: 403 });
    }
    if (anchor.status !== "APPROVED") {
      return NextResponse.json({ error: "Add parts only to published stories." }, { status: 403 });
    }

    const seriesId = anchor.seriesId ?? randomUUID();
    const parts = anchor.seriesId
      ? await prisma.post.findMany({
        where: { seriesId },
        select: { id: true, partIndex: true },
        orderBy: { partIndex: "asc" },
      })
      : [{ id: anchor.id, partIndex: anchor.partIndex }];

    const last = parts[parts.length - 1];
    if (!last || last.id !== id) {
      return NextResponse.json({ error: "Add the next part from the latest chapter." }, { status: 403 });
    }

    const newIndex = Math.max(...parts.map((part) => part.partIndex)) + 1;
    if (newIndex > 12) {
      return NextResponse.json({ error: "Stories can have at most 12 parts." }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const memberIds = anchor.seriesId
        ? (await tx.post.findMany({ where: { seriesId }, select: { id: true } })).map((row) => row.id)
        : [anchor.id];

      if (!anchor.seriesId) {
        await tx.post.update({
          where: { id: anchor.id },
          data: { seriesId, partIndex: 1, partTotal: newIndex },
        });
      } else {
        await tx.post.updateMany({
          where: { id: { in: memberIds } },
          data: { partTotal: newIndex },
        });
      }

      await tx.post.create({
        data: {
          content: content.trim(),
          language: anchor.language,
          anonymousId: anchor.anonymousId,
          status: "PENDING",
          isFlagged: containsBlacklisted(content),
          authorUserId: user.id,
          showAuthor: anchor.showAuthor,
          seriesId,
          partIndex: newIndex,
          partTotal: newIndex,
        },
      });
    });

    return NextResponse.json({
      message: "Next part submitted for moderation.",
      seriesId,
      partIndex: newIndex,
      partTotal: newIndex,
    }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Unable to add the next part right now." }, { status: 503 });
  }
}