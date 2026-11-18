"use client";

import { useRef, type ComponentPropsWithoutRef } from "react";
import { applyFormat, type FormatAction } from "@/lib/richText";

type RichTextEditorProps = Omit<ComponentPropsWithoutRef<"textarea">, "onChange"> & {
  value: string;
  onChange: (value: string) => void;
  toolbarLabel?: string;
};

const actions: Array<{ action: FormatAction; label: string; title: string }> = [
  { action: "bold", label: "B", title: "Bold" },
  { action: "italic", label: "I", title: "Italic" },
  { action: "quote", label: "❝", title: "Quote line" },
  { action: "break", label: "¶", title: "Paragraph break" },
];

export default function RichTextEditor({
  value,
  onChange,
  toolbarLabel = "Formatting",
  className = "compose-field rich-editor-field",
  id,
  ...rest
}: RichTextEditorProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  function runFormat(action: FormatAction) {
    const element = ref.current;
    if (!element) return;
    const start = element.selectionStart;
    const end = element.selectionEnd;
    const result = applyFormat(value, start, end, action);
    onChange(result.next);
    window.requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(result.selectionStart, result.selectionEnd);
    });
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar" role="toolbar" aria-label={toolbarLabel}>
        {actions.map((item) => (
          <button
            key={item.action}
            type="button"
            className="rich-editor-btn"
            title={item.title}
            aria-label={item.title}
            onClick={() => runFormat(item.action)}
          >
            {item.label}
          </button>
        ))}
        <span className="rich-editor-hint">**bold** · *italic* · &gt; quote</span>
      </div>
      <textarea
        {...rest}
        ref={ref}
        id={id}
        className={className}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}