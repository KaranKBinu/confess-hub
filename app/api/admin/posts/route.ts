import { NextRequest, NextResponse } from "next/server";
import { getRequestUser } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

export async function GET(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }

  try {
    const posts = await prisma.post.findMany({
      where: { status: "PENDING" },
      select: {
        id: true,
        content: true,
        language: true,
        isFlagged: true,
        createdAt: true,
        _count: { select: { reports: true } },
      },
      orderBy: [{ isFlagged: "desc" }, { createdAt: "asc" }],
      take: 100,
    });
    return NextResponse.json(posts, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "The moderation queue is temporarily unavailable." }, { status: 503 });
  }
}
