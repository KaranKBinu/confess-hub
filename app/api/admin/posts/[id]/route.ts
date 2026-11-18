import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isTrustedSameOrigin } from "@/lib/auth";
import prisma from "@/lib/prismaClient";

export async function PATCH(request: NextRequest, context: { params: { id: string } }) {
  const user = await getRequestUser(request);
  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ error: "Administrator access is required." }, { status: 403 });
  }
  if (!isTrustedSameOrigin(request)) {
    return NextResponse.json({ error: "Request origin was not accepted." }, { status: 403 });
  }

  const { id } = context.params;
  if (!id || id.length > 32) {
    return NextResponse.json({ error: "This pending story could not be found." }, { status: 404 });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }
  if (!payload || typeof payload !== "object" || !("action" in payload)) {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }

  const action = (payload as { action?: unknown }).action;
  if (action !== "approve" && action !== "reject") {
    return NextResponse.json({ error: "Choose approve or reject." }, { status: 400 });
  }

  try {
    await prisma.post.update({
      where: { id, status: "PENDING" },
      data: { status: action === "approve" ? "APPROVED" : "REJECTED" },
    });
    return NextResponse.json({ message: action === "approve" ? "Story approved." : "Story rejected." });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
      return NextResponse.json({ error: "This pending story could not be found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Moderation is temporarily unavailable." }, { status: 503 });
  }
}
