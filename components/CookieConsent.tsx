"use client";

import { useEffect } from "react";

const COOKIE_NAME = process.env.NEXT_PUBLIC_ANONYMOUS_COOKIE_NAME ?? "anon_id";
const MAX_AGE = 60 * 60 * 24 * 365;

export default function CookieConsent() {
  useEffect(() => {
    const exists = document.cookie
      .split(";")
      .some((cookie) => cookie.trim().startsWith(`${COOKIE_NAME}=`));

    if (!exists) {
      const anonymousId = window.crypto.randomUUID();
      document.cookie = `${COOKIE_NAME}=${anonymousId}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${
        window.location.protocol === "https:" ? "; Secure" : ""
      }`;
    }
  }, []);

  return (
    <span className="cookie-note">
      A random anonymous ID cookie helps prevent duplicate reports. <a href="/legal/privacy">Privacy</a>
    </span>
  );
}
