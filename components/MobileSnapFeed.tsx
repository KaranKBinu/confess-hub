"use client";

import type { ReactNode } from "react";
import type { LanguageCode } from "@/components/LanguageSelector";

export type SnapPost = {
  id: string;
  content: string;
  language: LanguageCode;
  createdAt: string;
  likes: number;
  dislikes: number;
  commentCount: number;
  viewerVote: "LIKE" | "DISLIKE" | null;
  seriesId: string | null;
  partIndex: number;
  partTotal: number | null;
  author: { username: string; displayName: string } | null;
  canEdit: boolean;
  canDelete: boolean;
  canAppendPart: boolean;
};

type MobileSnapFeedProps = {
  groups: Array<SnapPost | SnapPost[]>;
  renderItem: (post: SnapPost, options?: { inSeries?: boolean; partOnly?: boolean }) => ReactNode;
  renderSeriesMeta: (part: SnapPost, total: number) => ReactNode;
};

export default function MobileSnapFeed({
  groups,
  renderItem,
  renderSeriesMeta,
}: MobileSnapFeedProps) {
  return (
    <div className="mobile-feed-wrap">
      <div className="mobile-snap-feed" tabIndex={0}>
        {groups.map((group, index) => {
          if (Array.isArray(group)) {
            const key = group[0]?.seriesId ?? group[0]?.id ?? `series-${index}`;
            return (
              <article className="snap-feed-item snap-feed-item--series" key={key}>
                <div className="snap-parts-track" aria-label="Story parts">
                  {group.map((part) => (
                    <section className="snap-part-slide" key={part.id}>
                      {renderSeriesMeta(part, group.length)}
                      <div className="snap-part-body">
                        {renderItem(part, { partOnly: true })}
                      </div>
                    </section>
                  ))}
                </div>
                <div className="snap-series-footer">
                  {renderItem(group[group.length - 1], { inSeries: true })}
                </div>
              </article>
            );
          }

          return (
            <article className="snap-feed-item" key={group.id}>
              <div className="snap-single-card post-card">
                {renderItem(group)}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}