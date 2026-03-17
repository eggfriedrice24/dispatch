import type { DiffFile, DiffLine, Segment } from "../lib/diff-parser";
import type { Annotation } from "./ci-annotation";
import type { ReviewComment } from "./inline-comment";
import type { Highlighter } from "shiki";

import { useVirtualizer } from "@tanstack/react-virtual";
import { useMemo, useRef } from "react";

import { computeWordDiff } from "../lib/diff-parser";
import { BlamePopover, useBlameHover } from "./blame-popover";
import { CiAnnotation } from "./ci-annotation";
import { CommentComposer } from "./comment-composer";
import { InlineComment } from "./inline-comment";

/**
 * Virtualized diff viewer — DISPATCH-DESIGN-SYSTEM.md § 8.6
 *
 * Renders a parsed DiffFile with:
 * - Syntax highlighting (Shiki WASM)
 * - Word-level diff highlights
 * - Blame-on-hover
 * - Inline PR comments
 * - CI annotations
 * - Comment composer
 */

interface DiffViewerProps {
  file: DiffFile;
  highlighter?: Highlighter | null;
  language?: string;
  comments?: Map<string, ReviewComment[]>;
  annotations?: Map<string, Annotation[]>;
  prNumber?: number;
  activeComposer?: { line: number } | null;
  onGutterClick?: (line: number) => void;
  onCloseComposer?: () => void;
}

// ---------------------------------------------------------------------------
// Virtual row model
// ---------------------------------------------------------------------------

type FlatLine = DiffLine & { pairIndex: number | null };

type VirtualRow =
  | { kind: "line"; line: FlatLine }
  | { kind: "comment"; comments: ReviewComment[] }
  | { kind: "annotation"; annotations: Annotation[] }
  | { kind: "composer"; line: number };

function buildVirtualRows(
  file: DiffFile,
  comments: Map<string, ReviewComment[]>,
  annotations: Map<string, Annotation[]>,
  composerLine: number | null,
): VirtualRow[] {
  const rows: VirtualRow[] = [];
  const filePath = file.newPath || file.oldPath;

  for (const hunk of file.hunks) {
    rows.push({
      kind: "line",
      line: {
        type: "hunk-header",
        content: hunk.header,
        oldLineNumber: null,
        newLineNumber: null,
        pairIndex: null,
      },
    });

    for (let i = 0; i < hunk.lines.length; i++) {
      const line = hunk.lines[i]!;
      const next = hunk.lines[i + 1];

      let pairIndex: number | null = null;
      if (line.type === "del" && next?.type === "add") {
        pairIndex = rows.length + 1;
      } else if (line.type === "add" && i > 0 && hunk.lines[i - 1]?.type === "del") {
        pairIndex = rows.length - 1;
      }

      rows.push({ kind: "line", line: { ...line, pairIndex } });

      const lineNum = line.newLineNumber ?? line.oldLineNumber;

      if (lineNum) {
        const key = `${filePath}:${lineNum}`;
        const lineAnnotations = annotations.get(key);
        if (lineAnnotations && lineAnnotations.length > 0) {
          rows.push({ kind: "annotation", annotations: lineAnnotations });
        }

        const lineComments = comments.get(key);
        if (lineComments && lineComments.length > 0) {
          rows.push({ kind: "comment", comments: lineComments });
        }
      }

      if (composerLine && lineNum === composerLine) {
        rows.push({ kind: "composer", line: composerLine });
      }
    }
  }

  return rows;
}

const LINE_HEIGHT = 20;
const COMMENT_HEIGHT = 80;
const ANNOTATION_HEIGHT = 50;
const COMPOSER_HEIGHT = 130;

export function DiffViewer({
  file,
  highlighter,
  language,
  comments = new Map(),
  annotations = new Map(),
  prNumber,
  activeComposer,
  onGutterClick,
  onCloseComposer,
}: DiffViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { hoveredLine, anchorRect, onLineEnter, onLineLeave } = useBlameHover();

  const rows = useMemo(
    () => buildVirtualRows(file, comments, annotations, activeComposer?.line ?? null),
    [file, comments, annotations, activeComposer],
  );

  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => {
      const row = rows[index];
      if (!row) {
        return LINE_HEIGHT;
      }
      switch (row.kind) {
        case "line":
          return LINE_HEIGHT;
        case "comment":
          return COMMENT_HEIGHT;
        case "annotation":
          return ANNOTATION_HEIGHT;
        case "composer":
          return COMPOSER_HEIGHT;
      }
    },
    overscan: 20,
  });

  if (rows.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-text-tertiary text-xs">No changes in this file</p>
      </div>
    );
  }

  const filePath = file.newPath || file.oldPath;

  return (
    <div
      ref={scrollRef}
      className="bg-bg-root flex-1 overflow-auto"
    >
      <div
        style={{
          height: virtualizer.getTotalSize(),
          position: "relative",
          width: "100%",
        }}
      >
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index]!;

          return (
            <div
              key={item.index}
              data-index={item.index}
              ref={virtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${item.start}px)`,
                minHeight: item.size,
              }}
            >
              {row.kind === "line" && (
                <DiffRow
                  line={row.line}
                  rows={rows}
                  highlighter={highlighter ?? null}
                  language={language ?? "text"}
                  onLineEnter={onLineEnter}
                  onLineLeave={onLineLeave}
                  onGutterClick={onGutterClick}
                />
              )}
              {row.kind === "comment" && <InlineComment comments={row.comments} />}
              {row.kind === "annotation" && <CiAnnotation annotations={row.annotations} />}
              {row.kind === "composer" && prNumber && onCloseComposer && (
                <CommentComposer
                  prNumber={prNumber}
                  filePath={filePath}
                  line={row.line}
                  onClose={onCloseComposer}
                />
              )}
            </div>
          );
        })}
      </div>

      <BlamePopover
        file={filePath}
        line={hoveredLine}
        gitRef="HEAD"
        anchorRect={anchorRect}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Row renderer
// ---------------------------------------------------------------------------

function DiffRow({
  line,
  rows,
  highlighter,
  language,
  onLineEnter,
  onLineLeave,
  onGutterClick,
}: {
  line: FlatLine;
  rows: VirtualRow[];
  highlighter: Highlighter | null;
  language: string;
  onLineEnter: (lineNumber: number, rect: { top: number; left: number }) => void;
  onLineLeave: () => void;
  onGutterClick?: (line: number) => void;
}) {
  if (line.type === "hunk-header") {
    return (
      <div className="border-border-subtle bg-diff-hunk-bg text-info sticky top-0 z-[1] flex h-5 items-center border-y px-3 font-mono text-[11px]">
        {line.content}
      </div>
    );
  }

  // Word diff pairing
  const pairRow = line.pairIndex !== null ? rows[line.pairIndex] : null;
  const pair = pairRow?.kind === "line" ? pairRow.line : null;
  const wordDiff =
    pair &&
    ((line.type === "del" && pair.type === "add") || (line.type === "add" && pair.type === "del"))
      ? computeWordDiff(
          line.type === "del" ? line.content : pair.content,
          line.type === "add" ? line.content : pair.content,
        )
      : null;

  const hasWordDiff = !!wordDiff;
  const wordSegments = wordDiff
    ? line.type === "del"
      ? wordDiff.oldSegments
      : wordDiff.newSegments
    : null;

  // Syntax highlighting (skip if word diff is active — same as GitHub)
  const tokens =
    !hasWordDiff && highlighter && language !== "text"
      ? safeTokenize(highlighter, line.content, language)
      : null;

  const lineNum = line.newLineNumber ?? line.oldLineNumber;

  return (
    // biome-ignore lint: hover events for blame popover are intentional
    <div
      role="row"
      className={`flex h-5 items-center text-[12.5px] leading-5 hover:brightness-110 ${
        line.type === "add" ? "bg-diff-add-bg" : line.type === "del" ? "bg-diff-del-bg" : ""
      }`}
      style={{ tabSize: 4 }}
      onMouseEnter={(e) => {
        if (line.newLineNumber && line.type !== "del") {
          const rect = e.currentTarget.getBoundingClientRect();
          onLineEnter(line.newLineNumber, { top: rect.top, left: rect.left });
        }
      }}
      onMouseLeave={onLineLeave}
    >
      {/* Gutter: old line number */}
      <button
        type="button"
        className="text-text-ghost hover:text-text-tertiary inline-flex h-full w-[26px] shrink-0 cursor-pointer items-center justify-end border-none bg-transparent pr-1 font-mono text-[11px] select-none"
        onClick={() => lineNum && onGutterClick?.(lineNum)}
        tabIndex={-1}
      >
        {line.type !== "add" ? line.oldLineNumber : ""}
      </button>

      {/* Gutter: new line number */}
      <button
        type="button"
        className="text-text-ghost hover:text-text-tertiary inline-flex h-full w-[26px] shrink-0 cursor-pointer items-center justify-end border-none bg-transparent pr-1 font-mono text-[11px] select-none"
        onClick={() => lineNum && onGutterClick?.(lineNum)}
        tabIndex={-1}
      >
        {line.type !== "del" ? line.newLineNumber : ""}
      </button>

      {/* Marker */}
      <span
        className={`inline-flex h-full w-4 shrink-0 items-center justify-center font-mono text-[11px] font-semibold select-none ${
          line.type === "add"
            ? "text-success"
            : line.type === "del"
              ? "text-destructive"
              : "text-transparent"
        }`}
      >
        {line.type === "add" ? "+" : line.type === "del" ? "-" : " "}
      </span>

      {/* Code content */}
      <span className="text-text-primary flex-1 overflow-x-auto px-1 pr-3 font-mono whitespace-pre">
        {wordSegments ? (
          <WordDiffContent
            segments={wordSegments}
            type={line.type}
          />
        ) : tokens ? (
          <SyntaxContent tokens={tokens} />
        ) : (
          line.content
        )}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Syntax highlighted content
// ---------------------------------------------------------------------------

interface ShikiToken {
  content: string;
  color?: string;
}

function safeTokenize(
  highlighter: Highlighter,
  content: string,
  lang: string,
): ShikiToken[] | null {
  try {
    const loadedLangs = highlighter.getLoadedLanguages();
    if (!loadedLangs.includes(lang)) {
      return null;
    }
    const result = highlighter.codeToTokens(content, {
      lang: lang as Parameters<Highlighter["codeToTokens"]>[1]["lang"],
      theme: "github-dark-default",
    });
    return result.tokens[0] ?? null;
  } catch {
    return null;
  }
}

function SyntaxContent({ tokens }: { tokens: ShikiToken[] }) {
  return (
    <>
      {tokens.map((token, i) => (
        <span
          key={`${i}-${token.content.slice(0, 5)}`}
          style={{ color: token.color }}
        >
          {token.content}
        </span>
      ))}
    </>
  );
}

// ---------------------------------------------------------------------------
// Word-level diff highlighting
// ---------------------------------------------------------------------------

function WordDiffContent({
  segments,
  type,
}: {
  segments: Segment[];
  type: "add" | "del" | "context" | "hunk-header";
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "change") {
          return (
            <span
              key={`${i}-${seg.text.slice(0, 5)}`}
              className={`rounded-xs px-px ${
                type === "add" ? "bg-diff-add-word" : "bg-diff-del-word"
              }`}
            >
              {seg.text}
            </span>
          );
        }
        return <span key={`${i}-${seg.text.slice(0, 5)}`}>{seg.text}</span>;
      })}
    </>
  );
}
