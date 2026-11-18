"use client";

import { cloneElement, type ReactElement } from "react";

type TooltipProps = {
  label: string;
  side?: "top" | "bottom";
  children: ReactElement<{ className?: string; "aria-label"?: string }>;
};

export default function Tooltip({ label, side = "top", children }: TooltipProps) {
  return (
    <span className="tooltip-wrap" data-side={side}>
      {cloneElement(children, {
        className: [children.props.className, "has-tooltip"].filter(Boolean).join(" "),
        "aria-label": children.props["aria-label"] ?? label,
      })}
      <span className="tooltip-bubble" role="tooltip">
        {label}
      </span>
    </span>
  );
}