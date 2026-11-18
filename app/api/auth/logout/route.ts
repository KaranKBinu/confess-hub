import { NextRequest, NextResponse } from "next/server";
import { clearSession, isTrustedSameOrigin } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }
  const response = NextResponse.json({ message: "Signed out." });
  clearSession(response);
  return response;
}
