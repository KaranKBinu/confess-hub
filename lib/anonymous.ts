import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

export const ANONYMOUS_COOKIE_NAME = process.env.ANONYMOUS_COOKIE_NAME?.match(/^[A-Za-z0-9_-]+$/)
  ? process.env.ANONYMOUS_COOKIE_NAME
  : "anon_id";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_AGE = 60 * 60 * 24 * 365;

export function getOrCreateAnonymousId(request: Request): { id: string; isNew: boolean } {
  const cookieHeader = request.headers.get("cookie") ?? "";
  const cookie = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${ANONYMOUS_COOKIE_NAME}=`));
  const value = cookie?.slice(ANONYMOUS_COOKIE_NAME.length + 1);
  let id = "";
  try {
    id = value ? decodeURIComponent(value) : "";
  } catch {
    id = "";
  }

  return UUID_PATTERN.test(id) ? { id, isNew: false } : { id: randomUUID(), isNew: true };
}

export function setAnonymousCookie(response: NextResponse, id: string): void {
  response.cookies.set(ANONYMOUS_COOKIE_NAME, id, {
    httpOnly: false,
    maxAge: MAX_AGE,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

