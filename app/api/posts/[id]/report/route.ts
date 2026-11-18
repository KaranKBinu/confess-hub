import { NextResponse } from "next/server";
import { getOrCreateAnonymousId, setAnonymousCookie } from "@/lib/anonymous";
import prisma from "@/lib/prismaClient";

export async function POST(request: Request, context: { params: { id: string } }) {
  const { id } = context.params;
  if (!id || id.length > 32) {
    return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
  }

  const anonymous = getOrCreateAnonymousId(request);
  try {
    await prisma.$transaction(async (transaction) => {
      await transaction.report.create({
        data: { postId: id, reporterAnonymousId: anonymous.id },
      });
      await transaction.post.update({
        where: { id, status: "APPROVED" },
        data: { isFlagged: true, status: "PENDING" },
      });
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
      return NextResponse.json({ message: "Thanks, this story has already been reported." });
    }
    if (error && typeof error === "object" && "code" in error && ["P2003", "P2025"].includes(String(error.code))) {
      return NextResponse.json({ error: "That story could not be found." }, { status: 404 });
    }
    return NextResponse.json({ error: "Reporting is temporarily unavailable." }, { status: 503 });
  }

  const response = NextResponse.json({ message: "Thanks, this story was sent to moderation." });
  if (anonymous.isNew) setAnonymousCookie(response, anonymous.id);
  return response;
}