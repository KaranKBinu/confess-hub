"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PendingPost = {
  id: string;
  content: string;
  language: "en" | "ml" | "hi";
  isFlagged: boolean;
  createdAt: string;
  _count: { reports: number };
};

type AdminUser = { role: "USER" | "ADMIN" };

const languageNames = { en: "English", ml: "മലയാളം", hi: "हिन्दी" };

export default function ModeratePage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [posts, setPosts] = useState<PendingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/posts", { cache: "no-store" });
      const result = (await response.json()) as PendingPost[] | { error?: string };
      if (!response.ok) throw new Error("error" in result ? result.error : "Unable to load moderation queue.");
      setPosts(result as PendingPost[]);
      setMessage("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then(async (data: { user: AdminUser | null }) => {
        if (!active) return;
        const allowed = data.user?.role === "ADMIN";
        setIsAdmin(allowed);
        if (allowed) await loadQueue();
      })
      .catch(() => {
        if (active) setError("We couldn't verify your account. Please try again.");
      })
      .finally(() => {
        if (active) setCheckingAccess(false);
      });
    return () => { active = false; };
  }, [loadQueue]);

  async function review(postId: string, action: "approve" | "reject") {
    setError("");
    try {
      const response = await fetch(`/api/admin/posts/${encodeURIComponent(postId)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const result = (await response.json()) as { message?: string; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to update this story.");
      setPosts((current) => current.filter((post) => post.id !== postId));
      setMessage(result.message ?? (action === "approve" ? "Story approved." : "Story rejected."));
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to update this story.");
    }
  }

  return (
    <section className="admin-shell" aria-labelledby="moderation-title">
      <p className="eyebrow">Confess-Hub</p>
      <h1 id="moderation-title">Moderation queue</h1>
      <p className="admin-intro">Review new stories before they appear publicly. Keyword matches and community reports are prioritized.</p>

      {checkingAccess ? (
        <div className="empty-state" role="status">Checking administrator access…</div>
      ) : !isAdmin ? (
        <div className="auth-required-card">
          <h2>Administrator access required</h2>
          <p>Sign in with an administrator account to review stories.</p>
          <Link className="primary-button auth-link-button" href="/login?next=%2Fadmin%2Fmoderate">Log in as administrator</Link>
        </div>
      ) : (
        <>
          <div className="section-heading">
            <span className="count-label">{loading ? "Refreshing…" : `${posts.length} awaiting review`}</span>
            <button type="button" className="report-button" onClick={() => void loadQueue()}>Refresh</button>
          </div>
          <div className="admin-card">
            {posts.length ? posts.map((post) => (
              <article className="admin-post" key={post.id}>
                <div>
                  <p>{post.content}</p>
                  <small>
                    {languageNames[post.language]} · {new Date(post.createdAt).toLocaleString()} · {post._count.reports} report{post._count.reports === 1 ? "" : "s"}
                    {post.isFlagged ? " · keyword flagged" : ""}
                  </small>
                </div>
                <div className="admin-actions">
                  <button className="approve-button" type="button" onClick={() => void review(post.id, "approve")}>Approve</button>
                  <button className="reject-button" type="button" onClick={() => void review(post.id, "reject")}>Reject</button>
                </div>
              </article>
            )) : (
              <div className="empty-state">{loading ? "Loading the queue…" : "Nothing waiting for review. Nice work."}</div>
            )}
          </div>
        </>
      )}
      {message && <p className="status-message" role="status">{message}</p>}
      {error && <p className="status-message status-error" role="alert">{error}</p>}
    </section>
  );
}
