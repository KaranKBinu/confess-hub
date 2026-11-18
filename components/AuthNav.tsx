"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import Tooltip from "@/components/Tooltip";
import { IconLogin, IconShield, IconUser } from "@/components/NavIcons";

type AuthUser = { id: string; email: string; username: string; displayName: string; role: "USER" | "ADMIN" };

export default function AuthNav() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: AuthUser | null }) => {
        if (active) setUser(data.user);
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, []);

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.assign("/");
  }

  if (!user) {
    return (
      <div className="auth-nav auth-nav--icons">
        <Tooltip label="Log in">
          <Link className="nav-link nav-link-icon" href="/login">
            <IconLogin />
            <span>Log in</span>
          </Link>
        </Tooltip>
        <Link className="nav-signup" href="/signup">Sign up</Link>
      </div>
    );
  }

  return (
    <div className="auth-nav auth-nav--icons">
      {user.role === "ADMIN" ? (
        <Tooltip label="Moderation queue">
          <Link className="nav-link nav-link-icon admin-nav-link" href="/admin/moderate">
            <IconShield />
            <span>Moderation</span>
          </Link>
        </Tooltip>
      ) : null}
      <Tooltip label={`Profile · ${user.email}`}>
        <Link className="nav-link nav-link-icon nav-profile" href="/profile">
          <IconUser />
          <span>@{user.username}</span>
        </Link>
      </Tooltip>
      <button className="nav-link nav-logout" type="button" onClick={() => void signOut()}>Log out</button>
    </div>
  );
}
