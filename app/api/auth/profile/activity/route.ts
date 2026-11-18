import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

const kinds = new Set(["posts", "comments", "likes"]);

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) return NextResponse.json({ error: "Sign in to view your activity." }, { status: 401 });

  const kind = request.nextUrl.searchParams.get("kind") ?? "posts";
  if (!kinds.has(kind)) {
    return NextResponse.json({ error: "Choose posts, comments, or likes." }, { status: 400 });
  }

  const take = Math.min(80, Math.max(1, Number(request.nextUrl.searchParams.get("limit") ?? 40) || 40));

  try {
    if (kind === "posts") {
      const posts = await prisma.post.findMany({
        where: { authorUserId: user.id },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          content: true,
          language: true,
          status: true,
          createdAt: true,
          partIndex: true,
          partTotal: true,
          _count: { select: { comments: true, votes: true } },
        },
      });
      return NextResponse.json({
        items: posts.map((post) => ({
          id: post.id,
          content: post.content,
          language: post.language,
          status: post.status,
          createdAt: post.createdAt,
          partIndex: post.partIndex,
          partTotal: post.partTotal,
          commentCount: post._count.comments,
          reactionCount: post._count.votes,
        })),
      }, { headers: { "Cache-Control": "no-store" } });
    }

    if (kind === "comments") {
      const comments = await prisma.comment.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take,
        select: {
          id: true,
          content: true,
          createdAt: true,
          post: { select: { id: true, content: true, language: true } },
        },
      });
      return NextResponse.json({
        items: comments.map((comment) => ({
          id: comment.id,
          content: comment.content,
          createdAt: comment.createdAt,
          post: comment.post,
        })),
      }, { headers: { "Cache-Control": "no-store" } });
    }

    const votes = await prisma.vote.findMany({
      where: { userId: user.id, value: "LIKE" },
      orderBy: { createdAt: "desc" },
      take,
      select: {
        createdAt: true,
        post: { select: { id: true, content: true, language: true, status: true } },
      },
    });
    return NextResponse.json({
      items: votes.map((vote) => ({
        createdAt: vote.createdAt,
        post: vote.post,
      })),
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Activity is temporarily unavailable." }, { status: 503 });
  }
}