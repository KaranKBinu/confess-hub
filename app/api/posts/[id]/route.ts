import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import { containsBlacklisted } from "@/lib/moderation";
import { viewerCanDeletePost, viewerCanEditPost } from "@/lib/postAccess";
import prisma from "@/lib/prismaClient";
import { getApprovedPostPreview } from "@/lib/postPreview";

export async function GET(_request: NextRequest, context: { params: { id: string } }) {
  try {
    const post = await getApprovedPostPreview(context.params.id);
    if (!post) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    return NextResponse.json({ post }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch {
    return NextResponse.json({ error: "Story preview is temporarily unavailable." }, { status: 503 });
  }
}

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to edit your story." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = context.params;
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send the updated story text." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("content" in payload)) {
    return NextResponse.json({ error: "Send the updated story text." }, { status: 400 });
  }
  const content = (payload as { content?: unknown }).content;
  if (typeof content !== "string" || !content.trim() || content.trim().length > 2000) {
    return NextResponse.json({ error: "Stories must be between 1 and 2,000 characters." }, { status: 400 });
  }

  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorUserId: true, createdAt: true, status: true, language: true },
    });
    if (!post) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    if (!viewerCanEditPost(user, post)) {
      return NextResponse.json({ error: "You can only edit your own stories within 24 hours of posting." }, { status: 403 });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        content: content.trim(),
        status: "PENDING",
        isFlagged: containsBlacklisted(content),
      },
      select: {
        id: true,
        content: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      post: updated,
      message: "Story updated and sent back to moderation.",
    });
  } catch {
    return NextResponse.json({ error: "Unable to update this story right now." }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to delete stories." }, { status: 401 });
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = context.params;
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      select: { id: true, authorUserId: true, createdAt: true, status: true },
    });
    if (!post) return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    if (!viewerCanDeletePost(user, post)) {
      return NextResponse.json({ error: "You do not have permission to delete this story." }, { status: 403 });
    }

    await prisma.post.delete({ where: { id } });
    return NextResponse.json({ message: "Story removed." });
  } catch {
    return NextResponse.json({ error: "Unable to delete this story right now." }, { status: 503 });
  }
}