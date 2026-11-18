import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact & support — Confess-Hub",
  description: "Get help with your account, moderation, privacy, or technical issues on Confess-Hub.",
};

const supportEmail = "support@confess-hub.app";

export default function ContactPage() {
  return (
    <article className="legal-content contact-page">
      <p className="eyebrow">We&apos;re listening</p>
      <h1>Contact &amp; support</h1>
      <p>
        Whether something broke, a story needs review, or you have a privacy question, reach out. We read every message and usually reply within two business days.
      </p>
      <section aria-labelledby="contact-options">
        <h2 id="contact-options">Ways to reach us</h2>
        <ul>
          <li>
            Email:{" "}
            <a href={`mailto:${supportEmail}?subject=Confess-Hub%20support`}>{supportEmail}</a>
          </li>
          <li>
            Account issues: include the email you signed up with (never send your password).
          </li>
          <li>
            Story reports: share the story link from <strong>Share</strong> on the post card.
          </li>
        </ul>
      </section>
      <section aria-labelledby="contact-faq">
        <h2 id="contact-faq">Quick answers</h2>
        <dl className="contact-faq">
          <div>
            <dt>Why is my confession pending?</dt>
            <dd>New posts are moderated for safety. Most clear stories go live within a day.</dd>
          </div>
          <div>
            <dt>Can I delete my account?</dt>
            <dd>Email us from your registered address and we&apos;ll remove your profile and comments.</dd>
          </div>
          <div>
            <dt>Is my email public?</dt>
            <dd>No. Only your chosen display name and username appear on comments.</dd>
          </div>
        </dl>
      </section>
      <p>
        See also our <Link href="/legal/privacy">privacy policy</Link> and <Link href="/legal/terms">community guidelines</Link>.
      </p>
    </article>
  );
}