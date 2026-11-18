import { rebuildContentFilters } from "@/lib/rebuildContentFilters";
import prisma from "@/lib/prismaClient";
import {
  TRENDING_LANGUAGES,
  computeTrendingScore,
  optionalAiBoost,
} from "@/lib/trending";

const TOP_PER_LANGUAGE = 30;

export async function recomputeTrending(options?: { useAi?: boolean }): Promise<{
  updated: number;
  languages: Record<string, number>;
  filterTokens: number;
  filterLanguages: Record<string, number>;
}> {
  const useAi = options?.useAi ?? process.env.TRENDING_USE_AI === "true";
  const languages: Record<string, number> = {};
  let updated = 0;

  for (const language of TRENDING_LANGUAGES) {
    const posts = await prisma.post.findMany({
      where: { language, status: "APPROVED" },
      select: { id: true, content: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: 250,
    });
    if (posts.length === 0) {
      languages[language] = 0;
      continue;
    }

    const postIds = posts.map((post) => post.id);
    const groupedVotes = await prisma.vote.groupBy({
      by: ["postId", "value"],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    });
    const commentCounts = await prisma.comment.groupBy({
      by: ["postId"],
      where: { postId: { in: postIds } },
      _count: { _all: true },
    });

    const voteCounts = new Map<string, { likes: number; dislikes: number }>();
    for (const row of groupedVotes) {
      const counts = voteCounts.get(row.postId) ?? { likes: 0, dislikes: 0 };
      if (row.value === "LIKE") counts.likes = row._count._all;
      else counts.dislikes = row._count._all;
      voteCounts.set(row.postId, counts);
    }
    const commentsByPost = new Map(commentCounts.map((row) => [row.postId, row._count._all]));

    const scored: Array<{ postId: string; score: number; signals: ReturnType<typeof computeTrendingScore>["signals"] }> = [];
    for (const post of posts) {
      const counts = voteCounts.get(post.id) ?? { likes: 0, dislikes: 0 };
      const aiBoost = useAi ? await optionalAiBoost(post.content) : 1;
      const { score, signals } = computeTrendingScore({
        content: post.content,
        createdAt: post.createdAt,
        likes: counts.likes,
        dislikes: counts.dislikes,
        commentCount: commentsByPost.get(post.id) ?? 0,
        aiBoost,
      });
      scored.push({ postId: post.id, score, signals });
    }

    scored.sort((left, right) => right.score - left.score);
    const top = scored.slice(0, TOP_PER_LANGUAGE);

    await prisma.$transaction([
      prisma.trendingEntry.deleteMany({ where: { language } }),
      ...top.map((entry) =>
        prisma.trendingEntry.create({
          data: {
            postId: entry.postId,
            language,
            score: entry.score,
            signals: entry.signals,
          },
        }),
      ),
    ]);

    languages[language] = top.length;
    updated += top.length;
  }

  const filters = await rebuildContentFilters();
  return {
    updated,
    languages,
    filterTokens: filters.tokens,
    filterLanguages: filters.languages,
  };
}