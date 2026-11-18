import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { getOrCreateAnonymousId, setAnonymousCookie } from "@/lib/anonymous";
import { containsBlacklisted } from "@/lib/moderation";
import { computeTrendingScore } from "@/lib/trending";
import { viewerCanAppendPart, viewerCanDeletePost, viewerCanEditPost } from "@/lib/postAccess";
import prisma from "@/lib/prismaClient";

const languages = ["en", "ml", "hi"] as const;
type Language = (typeof languages)[number];

function normalizeParts(payload: { content?: unknown; parts?: unknown }): string[] {
  if (Array.isArray(payload.parts)) {
    return payload.parts
      .filter((part): part is string => typeof part === "string")
      .map((part) => part.trim())
      .filter(Boolean)
      .slice(0, 12);
  }
  if (typeof payload.content === "string" && payload.content.trim()) {
    return [payload.content.trim()];
  }
  return [];
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const language = url.searchParams.get("language");
  const sortParam = url.searchParams.get("sort");
  const sort = sortParam === "top" ? "top" : sortParam === "random" ? "random" : "latest";
  const search = url.searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const token = url.searchParams.get("token")?.trim().slice(0, 80) ?? "";
  if (!language || !languages.includes(language as Language)) {
    return NextResponse.json({ error: "Choose English, Malayalam, or Hindi." }, { status: 400 });
  }

  try {
    const user = await getRequestUser(request);
    const posts = await prisma.post.findMany({
      where: {
        language: language as Language,
        status: "APPROVED",
        ...(search ? { content: { contains: search, mode: "insensitive" as const } } : {}),
        ...(token ? { content: { contains: token, mode: "insensitive" as const } } : {}),
      },
      select: {
        id: true,
        content: true,
        language: true,
        createdAt: true,
        seriesId: true,
        partIndex: true,
        partTotal: true,
        showAuthor: true,
        authorUserId: true,
        status: true,
        author: { select: { username: true, displayName: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 120,
    });
    const postIds = posts.map((post) => post.id);
    const groupedVotes = postIds.length ? await prisma.vote.groupBy({
      by: ["postId", "value"],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    }) : [];
    const commentCounts = postIds.length ? await prisma.comment.groupBy({
      by: ["postId"],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    }) : [];
    const userVotes = user && postIds.length ? await prisma.vote.findMany({
      where: { userId: user.id, postId: { in: postIds } },
      select: { postId: true, value: true },
    }) : [];

    const voteCounts = new Map<string, { likes: number; dislikes: number }>();
    for (const row of groupedVotes) {
      const counts = voteCounts.get(row.postId) ?? { likes: 0, dislikes: 0 };
      if (row.value === "LIKE") counts.likes = row._count._all;
      else counts.dislikes = row._count._all;
      voteCounts.set(row.postId, counts);
    }
    const commentsByPost = new Map(commentCounts.map((row) => [row.postId, row._count._all]));
    const viewerVotes = new Map(userVotes.map((vote) => [vote.postId, vote.value]));
    const now = Date.now();

    const result = posts.map((post) => {
      const counts = voteCounts.get(post.id) ?? { likes: 0, dislikes: 0 };
      const commentCount = commentsByPost.get(post.id) ?? 0;
      const { score: trendingScore } = computeTrendingScore({
        content: post.content,
        createdAt: post.createdAt,
        likes: counts.likes,
        dislikes: counts.dislikes,
        commentCount,
      });
      return {
        id: post.id,
        content: post.content,
        language: post.language,
        createdAt: post.createdAt,
        seriesId: post.seriesId,
        partIndex: post.partIndex,
        partTotal: post.partTotal,
        likes: counts.likes,
        dislikes: counts.dislikes,
        commentCount,
        viewerVote: viewerVotes.get(post.id) ?? null,
        trendingScore,
        author: post.showAuthor && post.author
          ? { username: post.author.username, displayName: post.author.displayName }
          : null,
        canEdit: viewerCanEditPost(user, post),
        canDelete: viewerCanDeletePost(user, post),
        canAppendPart: viewerCanAppendPart(
          user,
          post,
          !post.partTotal || post.partIndex === post.partTotal,
        ),
      };
    });
    if (sort === "top") {
      result.sort((left, right) => right.trendingScore - left.trendingScore);
    } else if (sort === "random") {
      for (let index = result.length - 1; index > 0; index -= 1) {
        const swap = Math.floor(Math.random() * (index + 1));
        const temp = result[index];
        result[index] = result[swap];
        result[swap] = temp;
      }
    }
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Stories are temporarily unavailable." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 24_000) {
    return NextResponse.json({ error: "The submission is too large." }, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Send a valid story to continue." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Send a valid story to continue." }, { status: 400 });
  }

  const body = payload as {
    content?: unknown;
    parts?: unknown;
    language?: unknown;
    showAuthor?: unknown;
    seriesId?: unknown;
  };

  const partBodies = normalizeParts(body);
  if (!partBodies.length || partBodies.some((part) => part.length > 2000)) {
    return NextResponse.json({ error: "Each part must be between 1 and 2,000 characters." }, { status: 400 });
  }
  if (typeof body.language !== "string" || !languages.includes(body.language as Language)) {
    return NextResponse.json({ error: "Choose English, Malayalam, or Hindi." }, { status: 400 });
  }

  const user = await getRequestUser(request as NextRequest);
  const showAuthor = Boolean(user && body.showAuthor === true);
  const partTotal = partBodies.length > 1 ? partBodies.length : null;
  const seriesId = partTotal
    ? (typeof body.seriesId === "string" && body.seriesId.trim() ? body.seriesId.trim() : randomUUID())
    : null;

  const anonymous = getOrCreateAnonymousId(request);
  try {
    await prisma.$transaction(
      partBodies.map((part, index) =>
        prisma.post.create({
          data: {
            content: part,
            language: body.language as Language,
            anonymousId: anonymous.id,
            status: "PENDING",
            isFlagged: containsBlacklisted(part),
            authorUserId: user?.id ?? null,
            showAuthor,
            seriesId,
            partIndex: index + 1,
            partTotal,
          },
        }),
      ),
    );

    if (showAuthor && user && body.showAuthor === true) {
      await prisma.user.update({
        where: { id: user.id },
        data: { showUsernameOnPosts: true },
      });
    }

    const response = NextResponse.json({
      message:
        partTotal && partTotal > 1
          ? `Thanks! Your ${partTotal}-part story is in the moderation queue.`
          : "Thanks for sharing. Your story is in the moderation queue.",
      seriesId,
    }, { status: 201 });
    if (anonymous.isNew) setAnonymousCookie(response, anonymous.id);
    return response;
  } catch {
    return NextResponse.json({ error: "We couldn't save your story right now. Please try again." }, { status: 503 });
  }
}