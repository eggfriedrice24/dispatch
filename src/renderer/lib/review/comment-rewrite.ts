import type { TextSelectionRange } from "@/renderer/lib/review/markdown-format";

export function hasSelectedText(selection: TextSelectionRange): boolean {
  return selection.end > selection.start;
}

export function buildCommentRewriteMessages(draft: string, selectedText: string) {
  return [
    {
      role: "system" as const,
      content: [
        "You rewrite selected passages from draft GitHub code review comments.",
        "Keep the author's intent, technical meaning, and markdown structure intact.",
        "Preserve @mentions, #references, code fences, inline code, links, task lists, and bullets when present.",
        "Write in a concise, direct, professional review tone.",
        "Return only the rewritten replacement text for the selected passage.",
        "Do not return explanations, quotes, or the full comment.",
      ].join(" "),
    },
    {
      role: "user" as const,
      content: [
        "Rewrite the highlighted passage from this draft review comment.",
        "",
        "Full draft comment:",
        "```markdown",
        draft,
        "```",
        "",
        "Selected passage to replace:",
        "```markdown",
        selectedText,
        "```",
      ].join("\n"),
    },
  ];
}

export function replaceSelection(
  value: string,
  selection: TextSelectionRange,
  replacement: string,
): { value: string; selection: TextSelectionRange } {
  const nextValue = `${value.slice(0, selection.start)}${replacement}${value.slice(selection.end)}`;
  return {
    value: nextValue,
    selection: {
      start: selection.start,
      end: selection.start + replacement.length,
    },
  };
}
