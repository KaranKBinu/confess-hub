import prisma from "@/lib/prismaClient";
import { TRENDING_LANGUAGES } from "@/lib/trending";
import { extractContentTokens } from "@/lib/contentTokens";

const TOP_TOKENS_PER_LANGUAGE = 80;
const LOOKBACK_DAYS = 90;
const MIN_FREQUENCY = 1;

export async function rebuildContentFilters(): Promise<{ tokens: number; languages: Record<string, number> }> {
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86_400_000);
  const languages: Record<string, number> = {};
  let tokens = 0;

  for (const language of TRENDING_LANGUAGES) {
    const posts = await prisma.post.findMany({
      where: { language, status: "APPROVED", createdAt: { gte: since } },
      select: { content: true },
      take: 800,
    });

    const frequency = new Map<string, number>();
    for (const post of posts) {
      for (const token of extractContentTokens(post.content, language)) {
        frequency.set(token, (frequency.get(token) ?? 0) + 1);
      }
    }

    const ranked = [...frequency.entries()]
      .filter(([, count]) => count >= MIN_FREQUENCY)
      .sort((left, right) => right[1] - left[1])
      .slice(0, TOP_TOKENS_PER_LANGUAGE);

    await prisma.$transaction([
      prisma.contentFilterToken.deleteMany({ where: { language } }),
      ...ranked.map(([token, count]) =>
        prisma.contentFilterToken.create({
          data: { token, language, frequency: count },
        }),
      ),
    ]);

    languages[language] = ranked.length;
    tokens += ranked.length;
  }

  return { tokens, languages };
}