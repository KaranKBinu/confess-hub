import type { Metadata } from "next";
import { redirect } from "next/navigation";
import prisma from "@/lib/prismaClient";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await prisma.post.findFirst({
    where: { id: params.id, status: "APPROVED" },
    select: { content: true, language: true },
  });
  if (!post) {
    return {
      title: "Story — Confess-Hub",
      description: "Read anonymous confessions and funny life stories on Confess-Hub.",
    };
  }

  const description = post.content.length > 200 ? `${post.content.slice(0, 197)}…` : post.content;
  const title = "A confession worth reading — Confess-Hub";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      siteName: "Confess-Hub",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function StoryShareLanding({ params }: PageProps) {
  const post = await prisma.post.findFirst({
    where: { id: params.id, status: "APPROVED" },
    select: { language: true },
  });
  const lang = post?.language ?? "en";
  redirect(`/?focus=${encodeURIComponent(params.id)}&lang=${lang}`);
}