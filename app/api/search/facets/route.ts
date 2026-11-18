import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prismaClient";

const languages = ["en", "ml", "hi"] as const;

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const language = url.searchParams.get("language");
  const limit = Math.min(40, Math.max(8, Number(url.searchParams.get("limit") ?? 24)));

  if (!language || !languages.includes(language as (typeof languages)[number])) {
    return NextResponse.json({ error: "Choose English, Malayalam, or Hindi." }, { status: 400 });
  }

  try {
    const facets = await prisma.contentFilterToken.findMany({
      where: { language: language as (typeof languages)[number] },
      orderBy: [{ frequency: "desc" }, { token: "asc" }],
      take: limit,
      select: { token: true, frequency: true, updatedAt: true },
    });
    return NextResponse.json({ facets }, { headers: { "Cache-Control": "public, max-age=120" } });
  } catch {
    return NextResponse.json({ error: "Filters are temporarily unavailable." }, { status: 503 });
  }
}