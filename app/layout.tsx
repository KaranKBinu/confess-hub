import type { Metadata } from "next";
import Link from "next/link";
import Script from "next/script";
import "./globals.css";
import LanguageSelector from "@/components/LanguageSelector";
import CookieConsent from "@/components/CookieConsent";
import AuthNav from "@/components/AuthNav";
import BottomNav from "@/components/BottomNav";
import ThemeProvider from "@/components/ThemeProvider";
import { themeInitScript } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Confess-Hub — stories worth sharing",
  description:
    "A welcoming, anonymous space for funny confessions and little life stories in Malayalam, English, and Hindi.",
  metadataBase: process.env.NEXT_PUBLIC_SITE_URL
    ? new URL(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined,
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="light">
      <body className="app-body">
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        <ThemeProvider>
        <a className="skip-link" href="#main-content">Skip to content</a>
        <header className="site-header">
          <div className="header-inner">
            <Link href="/" className="brand" aria-label="Confess-Hub home">
              <span className="brand-mark" aria-hidden="true">ch</span>
              <span>confess<span className="brand-accent">hub</span></span>
            </Link>
            <nav className="header-actions" aria-label="Main navigation">
              <Link className="nav-link" href="/">Stories</Link>
              <AuthNav />
              <LanguageSelector />
            </nav>
          </div>
        </header>
        <main id="main-content">{children}</main>
        <BottomNav />
        <footer className="site-footer">
          <div className="footer-inner">
            <span>Made for the stories we laugh about later.</span>
            <div className="footer-links">
              <Link href="/contact">Support</Link>
              <Link href="/legal/privacy">Privacy</Link>
              <Link href="/legal/terms">Guidelines</Link>
            </div>
            <CookieConsent />
          </div>
        </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
