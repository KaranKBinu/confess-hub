const defaultKeywords = ["buy followers", "free money", "click here to claim"];

function getBlacklist(): string[] {
  const configured = process.env.MODERATION_KEYWORDS;
  const keywords = configured === undefined ? defaultKeywords : configured.split(",");
  return keywords.map((word) => word.trim().normalize("NFKC").toLocaleLowerCase()).filter(Boolean);
}

export function containsBlacklisted(content: string): boolean {
  const normalizedContent = content.normalize("NFKC").toLocaleLowerCase();
  return getBlacklist().some((keyword) => normalizedContent.includes(keyword));
}
