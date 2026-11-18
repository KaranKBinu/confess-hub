"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

type Mode = "login" | "signup";

function AuthFormContent({ mode }: { mode: Mode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      const response = await fetch(`/api/auth/${isSignup ? "register" : "login"}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          ...(isSignup
            ? {
                displayName: displayName.trim() || undefined,
                username: username.trim() || undefined,
              }
            : {}),
        }),
      });
      const result = (await response.json()) as { error?: string; user?: { role: string } };
      if (!response.ok) throw new Error(result.error ?? "We couldn't complete sign in.");
      const requestedPath = searchParams.get("next");
      const destination = requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : result.user?.role === "ADMIN" ? "/admin/moderate" : "/";
      router.replace(destination);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to sign in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="auth-shell" aria-labelledby="auth-title">
      <div className="auth-card">
        <p className="eyebrow">Confess-Hub community</p>
        <h1 id="auth-title">{isSignup ? "Join the conversation" : "Welcome back"}</h1>
        <p className="auth-description">
          {isSignup ? "Create an account to react to stories and leave comments. Your stories stay anonymous." : "Sign in to comment and react to community stories."}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {isSignup ? (
            <>
              <div className="form-field">
                <label htmlFor="username">Username <span className="field-optional">(optional)</span></label>
                <input
                  id="username"
                  name="username"
                  autoComplete="username"
                  minLength={3}
                  maxLength={30}
                  pattern="[a-z][a-z0-9_]{2,29}"
                  placeholder="e.g. sunny_otter_42"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                />
                <span className="field-hint">Leave blank and we will generate a unique username you can change later.</span>
              </div>
              <div className="form-field">
                <label htmlFor="display-name">Display name <span className="field-optional">(optional)</span></label>
                <input id="display-name" name="name" autoComplete="nickname" minLength={2} maxLength={40} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How you appear in comments" />
              </div>
            </>
          ) : null}
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" autoComplete="email" maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : undefined} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} required />
            {isSignup ? <span className="field-hint">Use at least 12 characters.</span> : null}
          </div>
          {error && <p className="status-message status-error" role="alert">{error}</p>}
          <button className="primary-button auth-submit" type="submit" disabled={pending}>
            {pending ? "Please wait…" : isSignup ? "Create account" : "Log in"}
          </button>
        </form>
        <p className="auth-switch">
          {isSignup ? "Already have an account?" : "New to Confess-Hub?"}{" "}
          <Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Log in" : "Create an account"}</Link>
        </p>
      </div>
    </section>
  );
}

export default function AuthForm({ mode }: { mode: Mode }) {
  return (
    <Suspense fallback={<div className="auth-shell"><div className="auth-card">Loading…</div></div>}>
      <AuthFormContent mode={mode} />
    </Suspense>
  );
}
