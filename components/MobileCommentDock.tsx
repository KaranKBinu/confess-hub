"use client";

import Tooltip from "@/components/Tooltip";
import { IconSend } from "@/components/ReactionIcons";

type MobileCommentDockProps = {
  visible: boolean;
  displayName: string;
  username: string;
  placeholder: string;
  postLabel: string;
  value: string;
  pending: boolean;
  postCommentLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onDismiss: () => void;
};

function avatarInitial(displayName: string, username: string): string {
  return (displayName || username).charAt(0).toUpperCase();
}

export default function MobileCommentDock({
  visible,
  displayName,
  username,
  placeholder,
  postLabel,
  value,
  pending,
  postCommentLabel,
  onChange,
  onSubmit,
  onDismiss,
}: MobileCommentDockProps) {
  if (!visible) return null;

  return (
    <div className="ig-comment-dock" aria-label={postLabel}>
      <button type="button" className="ig-comment-dock-dismiss" onClick={onDismiss} aria-label="Close comment bar">
        ×
      </button>
      <form
        className="ig-comment-dock-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <span className="ig-comment-avatar ig-comment-avatar-self" aria-hidden="true">
          {avatarInitial(displayName, username)}
        </span>
        <input
          className="ig-comment-dock-input"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          maxLength={1000}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Tooltip label={postCommentLabel} side="top">
          <button
            className={`ig-comment-post icon-only${pending ? " action-pop" : ""}`}
            type="submit"
            disabled={pending || !value.trim()}
          >
            <IconSend />
          </button>
        </Tooltip>
      </form>
    </div>
  );
}