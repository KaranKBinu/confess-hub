import Link from "next/link";

export default function NotFound() {
  return (
    <section className="not-found-shell" aria-labelledby="not-found-title">
      <p className="eyebrow">404</p>
      <h1 id="not-found-title">This page wandered off.</h1>
      <p className="not-found-copy">
        The story you wanted is not here — maybe it was moderated, renamed, or the link is old. Head back to the feed and keep scrolling.
      </p>
      <div className="not-found-actions">
        <Link className="primary-button" href="/">Back to stories</Link>
        <Link className="secondary-button" href="/contact">Contact support</Link>
      </div>
    </section>
  );
}