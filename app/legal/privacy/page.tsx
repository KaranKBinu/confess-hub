export default function PrivacyPage() {
  return (
    <article className="legal-content">
      <p className="eyebrow">Confess-Hub</p>
      <h1>Privacy policy</h1>
      <p>Last updated: November 2026</p>

      <h2>Anonymous by design</h2>
      <p>Reading and submitting stories does not require an account. If you choose to create an account to comment or react to stories, we store your email address, display name, and a securely hashed password. These account details are not attached to your anonymous story submissions, which continue to use a random anonymous ID cookie.</p>

      <h2>Anonymous ID cookie</h2>
      <p>With your browser, Confess-Hub creates a persistent, random UUID cookie named <strong>anon_id</strong> (one year; configurable by the site operator). The cookie is readable by this site’s JavaScript and is sent to our own application when you submit a story or report content. It helps associate your submissions and prevent duplicate reports. It is not designed to identify you, and it is not currently used by a third-party analytics service.</p>

      <h2>What we store</h2>
      <p>Submitted story text, language, moderation status, timestamps, the anonymous ID associated with a submission, and reports are stored in the application database. If you create an account, comments and likes or dislikes are associated with that account. Stories are held for moderator review before publication. Moderators can see pending content and the number of reports; the anonymous ID is not shown in the moderator interface.</p>

      <h2>Service providers and retention</h2>
      <p>The site operator’s hosting and database providers process information to run the service and may keep operational logs under their own policies. Pending, approved, rejected, and reported content may be retained for moderation, safety, and service operation. Contact the site operator to request deletion or ask a privacy question.</p>

      <h2>Your choices</h2>
      <p>You can remove the cookie in your browser settings; doing so may make report deduplication less reliable. You can read stories without an account; an account is needed to comment or react. Do not submit a story if you are uncomfortable with moderators reviewing it or with its publication after approval.</p>
    </article>
  );
}