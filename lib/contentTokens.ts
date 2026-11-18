const EN_STOP = new Set([
  "about", "after", "again", "also", "and", "are", "because", "been", "before", "being", "but",
  "did", "does", "doing", "for", "from", "had", "has", "have", "her", "him", "his", "how",
  "into", "just", "like", "more", "most", "not", "now", "off", "one", "our", "out", "she",
  "some", "than", "that", "the", "their", "them", "then", "there", "they", "this", "too",
  "very", "was", "were", "what", "when", "who", "with", "you", "your",
]);

export function extractContentTokens(content: string, language: "en" | "ml" | "hi"): string[] {
  const seen = new Set<string>();
  const tokens: string[] = [];

  if (language === "en") {
    const words = content.toLowerCase().match(/[a-z0-9']+/g) ?? [];
    for (const raw of words) {
      const word = raw.replace(/^'+|'+$/g, "");
      if (word.length < 3 || word.length > 40 || EN_STOP.has(word)) continue;
      if (seen.has(word)) continue;
      seen.add(word);
      tokens.push(word);
    }
    return tokens;
  }

  const segments = content.split(/[\s,.;:!?()"'“”[\]{}]+/).map((part) => part.trim()).filter(Boolean);
  for (const segment of segments) {
    if (segment.length < 2 || segment.length > 48) continue;
    const key = segment.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tokens.push(key);
  }
  return tokens.slice(0, 40);
}