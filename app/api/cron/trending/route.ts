import { NextRequest, NextResponse } from "next/server";
import { recomputeTrending } from "@/lib/recomputeTrending";

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";

  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  return request.headers.get("x-cron-secret") === secret;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized cron caller." }, { status: 401 });
  }

  try {
    const result = await recomputeTrending();
    return NextResponse.json({
      ok: true,
      ...result,
      completedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Trending job failed." }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}