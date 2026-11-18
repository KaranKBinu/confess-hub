"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import LanguagePicker from "@/components/LanguagePicker";
import ThemePicker from "@/components/ThemePicker";
import RichTextContent from "@/components/RichTextContent";
import type { ThemePreference } from "@/lib/theme";

type ProfileUser = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  role: "USER" | "ADMIN";
  showUsernameOnPosts: boolean;
  themePreference: ThemePreference;
  createdAt: string;
  commentCount: number;
  likeCount: number;
  postCount: number;
};

type ActivityKind = "posts" | "comments" | "likes";

type ActivityPost = {
  id: string;
  content: string;
  language: string;
  status: string;
  createdAt: string;
  partIndex: number;
  partTotal: number | null;
  commentCount: number;
  reactionCount: number;
};

type ActivityComment = {
  id: string;
  content: string;
  createdAt: string;
  post: { id: string; content: string; language: string };
};

type ActivityLike = {
  createdAt: string;
  post: { id: string; content: string; language: string; status: string };
};

export default function ProfileClient() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showUsernameOnPosts, setShowUsernameOnPosts] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activityKind, setActivityKind] = useState<ActivityKind>("posts");
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState("");
  const [posts, setPosts] = useState<ActivityPost[]>([]);
  const [comments, setComments] = useState<ActivityComment[]>([]);
  const [likes, setLikes] = useState<ActivityLike[]>([]);

  useEffect(() => {
    void fetch("/api/auth/profile", { cache: "no-store" })
      .then(async (response) => {
        if (response.status === 401) {
          window.location.assign("/login?next=/profile");
          return;
        }
        const data = (await response.json()) as { user?: ProfileUser; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Unable to load profile.");
        if (data.user) {
          setProfile(data.user);
          setUsername(data.user.username);
          setDisplayName(data.user.displayName);
          setShowUsernameOnPosts(data.user.showUsernameOnPosts);
        }
      })
      .catch((loadError) => {
        setError(loadError instanceof Error ? loadError.message : "Unable to load profile.");
      })
      .finally(() => setLoading(false));
  }, []);

  const loadActivity = useCallback(async (kind: ActivityKind) => {
    setActivityLoading(true);
    setActivityError("");
    try {
      const response = await fetch(`/api/auth/profile/activity?kind=${encodeURIComponent(kind)}`, { cache: "no-store" });
      const data = (await response.json()) as { items?: unknown[]; error?: string };
      if (!response.ok) throw new Error(data.error ?? "Unable to load activity.");
      if (kind === "posts") setPosts((data.items ?? []) as ActivityPost[]);
      if (kind === "comments") setComments((data.items ?? []) as ActivityComment[]);
      if (kind === "likes") setLikes((data.items ?? []) as ActivityLike[]);
    } catch (activityError) {
      setActivityError(activityError instanceof Error ? activityError.message : "Unable to load activity.");
    } finally {
      setActivityLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!profile) return;
    void loadActivity(activityKind);
  }, [profile, activityKind, loadActivity]);

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile || pending) return;
    setPending(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, displayName, showUsernameOnPosts }),
      });
      const result = (await response.json()) as { user?: ProfileUser; error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to save profile.");
      if (result.user) {
        setProfile((current) => (current ? { ...current, ...result.user } : current));
        setUsername(result.user.username);
        setDisplayName(result.user.displayName);
        setShowUsernameOnPosts(result.user.showUsernameOnPosts);
      }
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save profile.");
    } finally {
      setPending(false);
    }
  }

  async function persistTheme(theme: ThemePreference) {
    if (!profile) return;
    const response = await fetch("/api/auth/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themePreference: theme }),
    });
    const result = (await response.json()) as { user?: ProfileUser; error?: string };
    if (!response.ok) throw new Error(result.error ?? "Unable to save theme.");
    if (result.user) {
      setProfile((current) => (current ? { ...current, ...result.user } : current));
    }
  }

  if (loading) {
    return (
      <div className="profile-shell">
        <div className="profile-card empty-state">Loading your profile…</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-shell">
        <div className="auth-required-card">
          <h2>Sign in required</h2>
          <p>{error || "Your session could not be loaded."}</p>
          <Link className="primary-button auth-link-button" href="/login?next=/profile">Log in</Link>
        </div>
      </div>
    );
  }

  const memberSince = new Intl.DateTimeFormat("en-IN", { dateStyle: "long" }).format(new Date(profile.createdAt));
  const avatarLetter = (profile.displayName || profile.username).charAt(0).toUpperCase();

  function formatWhen(iso: string) {
    return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  }

  return (
    <div className="profile-shell profile-shell--wide">
      <section className="profile-hero" aria-labelledby="profile-title">
        <div className="profile-avatar" aria-hidden="true">{avatarLetter}</div>
        <div>
          <p className="eyebrow">Your corner of the feed</p>
          <h1 id="profile-title">{profile.displayName}</h1>
          <p className="profile-handle">@{profile.username}</p>
          <p className="profile-meta">Member since {memberSince}</p>
        </div>
      </section>

      <div className="profile-layout">
        <div className="profile-layout-main">
          <section className="profile-card" aria-labelledby="stats-title">
            <h2 id="stats-title">Activity</h2>
            <dl className="profile-stats profile-stats--action">
              <div>
                <dt>My stories</dt>
                <dd>
                  <button type="button" className="stat-button" onClick={() => setActivityKind("posts")}>
                    {profile.postCount}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Comments</dt>
                <dd>
                  <button type="button" className="stat-button" onClick={() => setActivityKind("comments")}>
                    {profile.commentCount}
                  </button>
                </dd>
              </div>
              <div>
                <dt>Liked</dt>
                <dd>
                  <button type="button" className="stat-button" onClick={() => setActivityKind("likes")}>
                    {profile.likeCount}
                  </button>
                </dd>
              </div>
            </dl>
            <p className="profile-note">Tap a number to browse your stories, comments, or likes. Stories stay anonymous unless you opt in per post.</p>
          </section>

          <section className="profile-card" aria-labelledby="activity-title">
            <div className="profile-activity-head">
              <h2 id="activity-title">
                {activityKind === "posts" ? "My stories" : activityKind === "comments" ? "My comments" : "Stories I liked"}
              </h2>
              <div className="sort-tabs" role="tablist" aria-label="Activity type">
                <button type="button" role="tab" aria-selected={activityKind === "posts"} className={activityKind === "posts" ? "sort-tab active" : "sort-tab"} onClick={() => setActivityKind("posts")}>Stories</button>
                <button type="button" role="tab" aria-selected={activityKind === "comments"} className={activityKind === "comments" ? "sort-tab active" : "sort-tab"} onClick={() => setActivityKind("comments")}>Comments</button>
                <button type="button" role="tab" aria-selected={activityKind === "likes"} className={activityKind === "likes" ? "sort-tab active" : "sort-tab"} onClick={() => setActivityKind("likes")}>Liked</button>
              </div>
            </div>
            {activityLoading ? <p className="field-hint">Loading…</p> : null}
            {activityError ? <p className="status-message status-error" role="alert">{activityError}</p> : null}
            {!activityLoading && activityKind === "posts" && !posts.length ? (
              <p className="empty-state">No stories yet. Share one from the home feed.</p>
            ) : null}
            {!activityLoading && activityKind === "comments" && !comments.length ? (
              <p className="empty-state">You have not commented yet.</p>
            ) : null}
            {!activityLoading && activityKind === "likes" && !likes.length ? (
              <p className="empty-state">No likes yet — react to a story from the feed.</p>
            ) : null}
            <ul className="activity-list">
              {activityKind === "posts"
                ? posts.map((post) => (
                    <li key={post.id} className="activity-item">
                      <div className="activity-item-meta">
                        <span className={`status-pill status-pill--${post.status.toLowerCase()}`}>{post.status}</span>
                        <time dateTime={post.createdAt}>{formatWhen(post.createdAt)}</time>
                        {post.partTotal && post.partTotal > 1 ? (
                          <span className="field-hint">Part {post.partIndex}/{post.partTotal}</span>
                        ) : null}
                      </div>
                      <RichTextContent content={post.content} />
                      <div className="activity-item-foot">
                        <Link href={`/?focus=${encodeURIComponent(post.id)}`}>Open in feed</Link>
                        <span className="field-hint">{post.commentCount} comments · {post.reactionCount} reactions</span>
                      </div>
                    </li>
                  ))
                : null}
              {activityKind === "comments"
                ? comments.map((comment) => (
                    <li key={comment.id} className="activity-item">
                      <div className="activity-item-meta">
                        <time dateTime={comment.createdAt}>{formatWhen(comment.createdAt)}</time>
                      </div>
                      <p className="activity-comment-text">{comment.content}</p>
                      <RichTextContent content={comment.post.content} className="rich-text activity-story-snippet" />
                      <div className="activity-item-foot">
                        <Link href={`/?focus=${encodeURIComponent(comment.post.id)}`}>View story</Link>
                      </div>
                    </li>
                  ))
                : null}
              {activityKind === "likes"
                ? likes.map((like, index) => (
                    <li key={`${like.post.id}-${index}`} className="activity-item">
                      <div className="activity-item-meta">
                        <time dateTime={like.createdAt}>Liked {formatWhen(like.createdAt)}</time>
                        {like.post.status !== "APPROVED" ? (
                          <span className="status-pill status-pill--pending">{like.post.status}</span>
                        ) : null}
                      </div>
                      <RichTextContent content={like.post.content} />
                      <div className="activity-item-foot">
                        <Link href={`/?focus=${encodeURIComponent(like.post.id)}`}>Open in feed</Link>
                      </div>
                    </li>
                  ))
                : null}
            </ul>
          </section>
        </div>

        <aside className="profile-layout-side">
          <section className="profile-card" aria-labelledby="theme-title">
            <h2 id="theme-title">Appearance</h2>
            <ThemePicker
              description="Default is light. Your choice syncs to this account on signed-in devices."
              onPersist={persistTheme}
            />
          </section>

          <section className="profile-card" aria-labelledby="language-title">
            <h2 id="language-title">Feed language</h2>
            <LanguagePicker description="Stories, search, and topic filters follow this language across the app." />
          </section>

          <section className="profile-card" aria-labelledby="edit-title">
            <h2 id="edit-title">Public identity</h2>
            <form className="auth-form" onSubmit={saveProfile}>
              <div className="form-field">
                <label htmlFor="profile-username">Username</label>
                <input
                  id="profile-username"
                  name="username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z][a-z0-9_]{2,29}"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  required
                />
                <span className="field-hint">Unique handle shown in comments (lowercase, letters, numbers, underscores).</span>
              </div>
              <div className="form-field">
                <label htmlFor="profile-display-name">Display name</label>
                <input
                  id="profile-display-name"
                  name="displayName"
                  autoComplete="nickname"
                  minLength={2}
                  maxLength={40}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                />
              </div>
              <label className="compose-choice">
                <input
                  type="checkbox"
                  checked={showUsernameOnPosts}
                  onChange={(event) => setShowUsernameOnPosts(event.target.checked)}
                />
                <span>Default: show my @username on new story posts</span>
              </label>
              <div className="form-field">
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" name="email" type="email" value={profile.email} readOnly disabled />
              </div>
              {message && <p className="status-message" role="status">{message}</p>}
              {error && <p className="status-message status-error" role="alert">{error}</p>}
              <button className="primary-button auth-submit" type="submit" disabled={pending}>
                {pending ? "Saving…" : "Save changes"}
              </button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}