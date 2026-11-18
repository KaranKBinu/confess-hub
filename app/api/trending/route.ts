import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

const languages = ["en", "ml", "hi"] as const;

export async function GET(request: NextRequest) {
  const language = new URL(request.url).searchParams.get("language");
  const limit = Math.min(12, Math.max(1, Number(new URL(request.url).searchParams.get("limit") ?? 6)));

  if (!language || !languages.includes(language as (typeof languages)[number])) {
    return NextResponse.json({ error: "Choose English, Malayalam, or Hindi." }, { status: 400 });
  }

  try {
    const entries = await prisma.trendingEntry.findMany({
      where: { language: language as (typeof languages)[number] },
      orderBy: { score: "desc" },
      take: limit,
      include: {
        post: {
          select: {
            id: true,
            content: true,
            language: true,
            createdAt: true,
            seriesId: true,
            partIndex: true,
            partTotal: true,
            showAuthor: true,
            author: { select: { username: true, displayName: true } },
          },
        },
      },
    });

    const result = entries.map((entry) => ({
      id: entry.post.id,
      content: entry.post.content,
      language: entry.post.language,
      createdAt: entry.post.createdAt,
      score: entry.score,
      signals: entry.signals,
      seriesId: entry.post.seriesId,
      partIndex: entry.post.partIndex,
      partTotal: entry.post.partTotal,
      author: entry.post.showAuthor && entry.post.author
        ? { username: entry.post.author.username, displayName: entry.post.author.displayName }
        : null,
    }));

    return NextResponse.json(result, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch {
    return NextResponse.json({ error: "Trending stories are temporarily unavailable." }, { status: 503 });
  }
}