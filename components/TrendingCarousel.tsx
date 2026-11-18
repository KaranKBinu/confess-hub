"use client";

import { useEffect, useState } from "react";
import type { LanguageCode } from "@/components/LanguageSelector";

export type TrendingStory = {
  id: string;
  content: string;
  score: number;
  author: { username: string; displayName: string } | null;
  partIndex: number;
  partTotal: number | null;
};

type Props = {
  language: LanguageCode;
  title: string;
  loadingLabel: string;
  emptyLabel: string;
  bylinePrefix: string;
  partLabel: (index: number, total: number | null) => string;
};

export default function TrendingCarousel({ language, title, loadingLabel, emptyLabel, bylinePrefix, partLabel }: Props) {
  const [items, setItems] = useState<TrendingStory[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    void fetch(`/api/trending?language=${language}&limit=8`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error("load failed");
        return (await response.json()) as TrendingStory[];
      })
      .then((data) => {
        setItems(data);
        setIndex(0);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [language]);

  useEffect(() => {
    if (items.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [items.length]);

  const active = items[index];

  return (
    <section className="hero hero-carousel" aria-labelledby="trending-hero-title">
      <p className="eyebrow">{title}</p>
      <h1 id="trending-hero-title">{title}</h1>
      {loading ? (
        <p className="hero-copy">{loadingLabel}</p>
      ) : !active ? (
        <p className="hero-copy">{emptyLabel}</p>
      ) : (
        <div className="carousel-slide" aria-live="polite">
          {active.partTotal && active.partTotal > 1 ? (
            <p className="series-badge">{partLabel(active.partIndex, active.partTotal)}</p>
          ) : null}
          <p className="carousel-story">{active.content}</p>
          {active.author ? (
            <p className="carousel-byline">
              {bylinePrefix} <strong>@{active.author.username}</strong>
            </p>
          ) : null}
          <div className="carousel-dots" role="tablist" aria-label="Trending stories">
            {items.map((item, dotIndex) => (
              <button
                key={item.id}
                type="button"
                className={dotIndex === index ? "carousel-dot active" : "carousel-dot"}
                aria-current={dotIndex === index ? "true" : undefined}
                onClick={() => setIndex(dotIndex)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}