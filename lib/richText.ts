import { createElement, Fragment, type ReactNode } from "react";

export type FormatAction = "bold" | "italic" | "quote" | "break";

export function applyFormat(
  value: string,
  selectionStart: number,
  selectionEnd: number,
  action: FormatAction,
): { next: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(selectionStart, selectionEnd);
  let wrapped = selected;
  if (action === "bold") wrapped = `**${selected || "bold"}**`;
  if (action === "italic") wrapped = `*${selected || "italic"}*`;
  if (action === "quote") wrapped = selected ? selected.split("\n").map((line) => `> ${line}`).join("\n") : "> ";
  if (action === "break") wrapped = selected ? `${selected}\n\n` : "\n\n";
  const next = `${value.slice(0, selectionStart)}${wrapped}${value.slice(selectionEnd)}`;
  const start = selectionStart;
  const end = selectionStart + wrapped.length;
  return { next, selectionStart: start, selectionEnd: end };
}

function parseInline(line: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let match: RegExpExecArray | null;
  const source = line;
  const simplePattern = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let cursor = 0;
  while ((match = simplePattern.exec(source)) !== null) {
    if (match.index > cursor) {
      nodes.push(source.slice(cursor, match.index));
    }
    if (match[1]) {
      nodes.push(createElement("strong", { key: `${match.index}-b` }, match[1]));
    } else if (match[2]) {
      nodes.push(createElement("em", { key: `${match.index}-i` }, match[2]));
    }
    cursor = match.index + match[0].length;
  }
  if (cursor < source.length) nodes.push(source.slice(cursor));
  if (!nodes.length) nodes.push(line);
  return nodes;
}

export function renderRichText(content: string): ReactNode {
  const lines = content.split("\n");
  const blocks: ReactNode[] = [];
  lines.forEach((line, index) => {
    const trimmed = line.trimStart();
    if (trimmed.startsWith("> ")) {
      blocks.push(
        createElement(
          "blockquote",
          { key: `q-${index}`, className: "rich-quote" },
          parseInline(trimmed.slice(2)),
        ),
      );
      return;
    }
    if (!line.trim()) {
      blocks.push(createElement("br", { key: `br-${index}` }));
      return;
    }
    blocks.push(
      createElement(Fragment, { key: `p-${index}` }, [
        ...parseInline(line),
        index < lines.length - 1 ? createElement("br", { key: `ln-${index}` }) : null,
      ]),
    );
  });
  return createElement(Fragment, null, blocks);
}