"use client";

type ShareSheetProps = {
  open: boolean;
  title: string;
  excerpt: string;
  url: string;
  copyLabel: string;
  shareLabel: string;
  closeLabel: string;
  copiedLabel: string;
  onClose: () => void;
  onCopied: () => void;
};

export default function ShareSheet({
  open,
  title,
  excerpt,
  url,
  copyLabel,
  shareLabel,
  closeLabel,
  copiedLabel,
  onClose,
  onCopied,
}: ShareSheetProps) {
  if (!open) return null;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      onCopied();
    } catch {
      // ignore
    }
  }

  async function nativeShare() {
    if (typeof navigator.share !== "function") {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, text: `${excerpt}\n\n— Confess-Hub`, url });
      onClose();
    } catch {
      // user dismissed
    }
  }

  return (
    <div className="share-sheet-backdrop" role="presentation" onClick={onClose}>
      <div
        className="share-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <p className="share-sheet-title">{title}</p>
        <p className="share-sheet-excerpt">{excerpt}</p>
        <input className="share-sheet-url" value={url} readOnly onFocus={(event) => event.currentTarget.select()} />
        <div className="share-sheet-actions">
          <button type="button" className="primary-button" onClick={() => void nativeShare()}>
            {shareLabel}
          </button>
          <button type="button" className="secondary-button" onClick={() => void copyLink()}>
            {copyLabel}
          </button>
          <button type="button" className="text-button" onClick={onClose}>
            {closeLabel}
          </button>
        </div>
        <p className="field-hint share-sheet-note">{copiedLabel}</p>
      </div>
    </div>
  );
}