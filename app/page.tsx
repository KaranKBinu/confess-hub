import HomeClient from "@/components/HomeClient";
import type { LanguageCode } from "@/components/LanguageSelector";

type HomeProps = {
  searchParams?: { focus?: string; lang?: string };
};

export default function Home({ searchParams }: HomeProps) {
  const focusId = typeof searchParams?.focus === "string" ? searchParams.focus : undefined;
  const langParam = searchParams?.lang;
  const initialLanguage: LanguageCode | undefined =
    langParam === "en" || langParam === "ml" || langParam === "hi" ? langParam : undefined;

  return (
    <HomeClient
      initialFocusId={focusId}
      initialLanguage={initialLanguage}
      syncLanguageFromUrl={Boolean(initialLanguage)}
    />
  );
}