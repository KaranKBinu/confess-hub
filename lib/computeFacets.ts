import { extractContentTokens } from "@/lib/contentTokens";
export function computeFacetsFromContents(
  contents: string[],
  language: "en" | "ml" | "hi",
  options?: { minFrequency?: number; limit?: number },
): Array<{ token: string; frequency: number }> {
  const minFrequency = options?.minFrequency ?? 1;
  const limit = options?.limit ?? 24;
  const frequency = new Map<string, number>();

  for (const content of contents) {
    for (const token of extractContentTokens(content, language)) {
      frequency.set(token, (frequency.get(token) ?? 0) + 1);
    }
  }

  return [...frequency.entries()]
    .filter(([, count]) => count >= minFrequency)
    .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
    .slice(0, limit)
    .map(([token, count]) => ({ token, frequency: count }));
}