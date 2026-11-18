import type { Metadata } from "next";
import HomeClient from "@/components/HomeClient";
import { getApprovedPostPreview } from "@/lib/postPreview";
import type { LanguageCode } from "@/components/LanguageSelector";

type PageProps = { params: { id: string } };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const post = await getApprovedPostPreview(params.id);
  if (!post) {
    return {
      title: "Story — Confess-Hub",
      description: "Read community stories on Confess-Hub.",
    };
  }
  const description = post.content.replace(/\s+/g, " ").trim().slice(0, 180);
  const title = "A story worth sharing — Confess-Hub";
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
      card: "summary",
      title,
      description,
    },
  };
}

export default async function SharedStoryPage({ params }: PageProps) {
  const post = await getApprovedPostPreview(params.id);
  const initialLanguage = (post?.language ?? "en") as LanguageCode;
  return <HomeClient initialFocusId={params.id} initialLanguage={initialLanguage} />;
}