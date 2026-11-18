import type { PostLanguage } from "@prisma/client";

export type TrendingSignals = {
  engagement: number;
  recency: number;
  regexBoost: number;
  aiBoost: number;
  likes: number;
  dislikes: number;
  comments: number;
  ageHours: number;
};

const RELATABLE_PATTERN =
  /\b(lol|lmao|cringe|awkward|relatable|plot twist|group chat|bestie|trauma dump|main character)\b|ചിരി|അബ്സർഡ്|मज़ेदार|अजीब|हँस/i;

export function regexEngagementBoost(content: string): number {
  const matches = content.match(new RegExp(RELATABLE_PATTERN.source, RELATABLE_PATTERN.flags + "g"));
  if (!matches) return 1;
  return 1 + Math.min(0.35, matches.length * 0.08);
}

export function computeTrendingScore(input: {
  content: string;
  createdAt: Date;
  likes: number;
  dislikes: number;
  commentCount: number;
  aiBoost?: number;
}): { score: number; signals: TrendingSignals } {
  const ageHours = Math.max(0.25, (Date.now() - input.createdAt.getTime()) / 3_600_000);
  const engagement = input.likes * 2.2 + input.commentCount * 3.1 - input.dislikes * 1.4;
  const recency = Math.exp(-ageHours / 60);
  const regexBoost = regexEngagementBoost(input.content);
  const aiBoost = input.aiBoost ?? 1;
  const score = Math.max(0, engagement * recency * regexBoost * aiBoost);

  return {
    score,
    signals: {
      engagement,
      recency,
      regexBoost,
      aiBoost,
      likes: input.likes,
      dislikes: input.dislikes,
      comments: input.commentCount,
      ageHours,
    },
  };
}

export async function optionalAiBoost(content: string): Promise<number> {
  const baseUrl = process.env.LM_STUDIO_BASE_URL?.replace(/\/$/, "");
  if (!baseUrl) return 1;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${baseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.LM_STUDIO_TRENDING_MODEL ?? "openai/gpt-oss-20b",
        temperature: 0,
        max_tokens: 24,
        messages: [
          {
            role: "system",
            content:
              "Reply with ONLY a number from 0.85 to 1.25 estimating viral/share potential of a confession post. 1.0 is average.",
          },
          { role: "user", content: content.slice(0, 800) },
        ],
      }),
    });
    if (!response.ok) return 1;
    const data = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const raw = data.choices?.[0]?.message?.content?.trim() ?? "1";
    const parsed = Number.parseFloat(raw.replace(/[^\d.]/g, ""));
    if (!Number.isFinite(parsed)) return 1;
    return Math.min(1.25, Math.max(0.85, parsed));
  } catch {
    return 1;
  } finally {
    clearTimeout(timeout);
  }
}

export const TRENDING_LANGUAGES: PostLanguage[] = ["en", "ml", "hi"];