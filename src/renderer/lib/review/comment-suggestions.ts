import {
  getCommentTarget,
  type CommentRange,
  type FlatRow,
} from "@/renderer/components/review/diff/diff-row-builder";

export function getSuggestionTextForRange(
  rows: FlatRow[],
  range: CommentRange | null,
): string | null {
  if (range === null || range.side !== "RIGHT") {
    return null;
  }

  const lines: string[] = [];

  for (const row of rows) {
    if (row.kind === "line" && row.line.type !== "hunk-header") {
      const target = getCommentTarget(row.line);
      if (
        target !== null &&
        target.side === range.side &&
        target.line >= range.startLine &&
        target.line <= range.endLine
      ) {
        lines.push(row.line.content);
      }
    }
  }

  return lines.length > 0 ? lines.join("\n") : null;
}
