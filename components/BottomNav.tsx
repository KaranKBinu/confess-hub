"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { IconHome, IconLogin, IconPen, IconShield, IconUser } from "@/components/NavIcons";

type AuthUser = { id: string; username: string; role: "USER" | "ADMIN" };

export default function BottomNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    void fetch("/api/auth/me", { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { user: AuthUser | null }) => setUser(data.user))
      .catch(() => undefined);
  }, [pathname]);

  function scrollToCompose() {
    const node = document.getElementById("compose-anchor");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const onHome = pathname === "/";
  const onProfile = pathname === "/profile";
  const onLogin = pathname === "/login" || pathname === "/signup";
  const onAdmin = pathname.startsWith("/admin");

  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <div className={`bottom-nav-inner${user?.role === "ADMIN" ? " bottom-nav-inner--admin" : ""}`}>
        <NavItem href="/" label="Feed" active={onHome}>
          <IconHome />
        </NavItem>

        <NavItem
          as="button"
          label="Create"
          active={false}
          className="bottom-nav-create"
          onClick={scrollToCompose}
        >
          <span className="bottom-nav-create-icon">
            <IconPen />
          </span>
        </NavItem>

        {user?.role === "ADMIN" ? (
          <NavItem href="/admin/moderate" label="Mod" active={onAdmin}>
            <IconShield />
          </NavItem>
        ) : null}

        {user ? (
          <NavItem href="/profile" label="Profile" active={onProfile}>
            <IconUser />
          </NavItem>
        ) : (
          <NavItem href="/login" label="Log in" active={onLogin}>
            <IconLogin />
          </NavItem>
        )}
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
  children,
  className = "",
  as,
  onClick,
}: {
  href?: string;
  label: string;
  active: boolean;
  children: ReactNode;
  className?: string;
  as?: "button";
  onClick?: () => void;
}) {
  const classes = active ? `bottom-nav-item active ${className}`.trim() : `bottom-nav-item ${className}`.trim();

  if (as === "button") {
    return (
      <button type="button" className={classes} aria-label={label} onClick={onClick}>
        {children}
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Link href={href ?? "/"} className={classes} aria-current={active ? "page" : undefined} aria-label={label}>
      {children}
      <span>{label}</span>
    </Link>
  );
}