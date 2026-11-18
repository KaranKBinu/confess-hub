import prisma from "@/lib/prismaClient";

export async function getApprovedPostPreview(id: string) {
  if (!id || id.length > 40) return null;
  return prisma.post.findFirst({
    where: { id, status: "APPROVED" },
    select: { id: true, content: true, language: true, createdAt: true },
  });
}