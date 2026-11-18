import { randomInt } from "node:crypto";

const ADJECTIVES = [
  "quiet", "sunny", "witty", "brave", "cosmic", "mellow", "zesty", "kind", "lucky", "velvet",
] as const;
const NOUNS = [
  "otter", "comet", "sparrow", "mango", "pixel", "ember", "cloud", "maple", "spark", "lantern",
] as const;

export const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,29}$/;

export function normalizeUsername(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidUsername(username: string): boolean {
  return USERNAME_PATTERN.test(username);
}

export function generateUsername(): string {
  const adjective = ADJECTIVES[randomInt(ADJECTIVES.length)]!;
  const noun = NOUNS[randomInt(NOUNS.length)]!;
  const suffix = randomInt(100, 999);
  return `${adjective}_${noun}_${suffix}`;
}

export function displayNameFromUsername(username: string): string {
  return username
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}