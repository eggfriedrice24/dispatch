import { getDiffFilePath, type DiffFile } from "@/renderer/lib/review/diff-parser";

/* eslint-disable max-params, no-continue -- Suggestion extraction is a linear rule pass over AI output and reads more clearly with guarded early exits. */
/**
 * AI Code Review Suggestions — types and utilities.
 *
 * Provides the data model for AI-generated review suggestions,
 * the prompt builder for structured JSON output, and a robust
 * response parser with line number validation.
 */

const DISPATCH_AI_REVIEW_MARKER_PREFIX = "dispatch-ai-review:";
const FNV_OFFSET_BASIS = 2_166_136_261;
const FNV_PRIME = 16_777_619;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type AiSuggestionSeverity = "critical" | "warning" | "suggestion";

export interface AiSuggestion {
  /** Client-generated unique ID. */
  id: string;
  /** File path (matches DiffFile.newPath). */
  path: string;
  /** NEW-side line number where the suggestion anchors. */
  line: number;
  /** Severity classification from the AI. */
  severity: AiSuggestionSeverity;
  /** One-line summary (≤10 words). */
  title: string;
  /** Full comment body (markdown, may include suggestion code blocks). */
  body: string;
  /** Current lifecycle status. */
  status: "pending" | "posted" | "dismissed";
}

export interface ExistingReviewComment {
  path: string;
  line: number | null;
  body: string;
}

export interface SuggestionPromptChangedFile {
  path: string;
  additions: number;
  deletions: number;
}

export interface SuggestionPromptDiffContext {
  text: string;
  lineAnchors: Map<number, string>;
}

// ---------------------------------------------------------------------------
// Severity styling (mirrors inline-comment.tsx parseSeverity colors)
// ---------------------------------------------------------------------------

export function getSeverityStyle(severity: AiSuggestionSeverity): {
  label: string;
  bg: string;
  color: string;
  border: string;
} {
  switch (severity) {
    case "critical": {
      return {
        label: "Critical",
        bg: "var(--danger-muted)",
        color: "var(--danger)",
        border: "var(--danger)",
      };
    }
    case "warning": {
      return {
        label: "Warning",
        bg: "var(--warning-muted)",
        color: "var(--warning)",
        border: "var(--warning)",
      };
    }
    case "suggestion": {
      return {
        label: "Suggestion",
        bg: "var(--bg-raised)",
        color: "var(--primary)",
        border: "var(--primary)",
      };
    }
  }
}

// ---------------------------------------------------------------------------
// Prompt builder
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are a senior code reviewer. Analyze the following diff and suggest review comments that a human reviewer would find genuinely helpful.

Work only from the PR metadata, changed-file manifest, existing review comments, and current file diff that are provided. Do not invent whole-codebase context or assume unchanged files were inspected.

Focus on:
- Bugs, logic errors, or security issues (severity: "critical")
- Missing error handling, performance issues, design improvements (severity: "warning")
- Minor improvements or better patterns (severity: "suggestion")

Rules:
- Return AT MOST 5 suggestions per file. Fewer is better.
- Prefer one strong comment over multiple overlapping comments.
- Do not repeat the same issue multiple times.
- Do not restate or closely paraphrase any existing review comment.
- Skip trivial formatting issues, style preferences, and obvious changes.
- The file diff uses machine-readable prefixes like [new:42 old:41 type:add].
- Only \`new:<number>\` values are valid anchors. Never anchor to deleted-only rows.
- Each suggestion must include \`anchorText\`, copied from the exact code text after the metadata prefix on the anchored row.
- Return ONLY a JSON array. No markdown fences, no explanation outside the array.
- Return an empty array [] if the code looks good.

JSON schema for each element:
{ "line": number, "anchorText": string, "severity": "critical"|"warning"|"suggestion", "title": string, "body": string }

The "body" field is the full review comment in GitHub-flavored markdown.
If suggesting a code replacement, use a \`\`\`suggestion code block.`;

export function buildSuggestionPrompt(
  prTitle: string,
  prBody: string,
  filePath: string,
  fileDiff: string,
  changedFiles: ReadonlyArray<SuggestionPromptChangedFile>,
  existingComments: ReadonlyArray<Pick<ExistingReviewComment, "line" | "body">>,
): Array<{ role: "system" | "user"; content: string }> {
  const description = prBody.length > 500 ? `${prBody.slice(0, 500)}…` : prBody;
  const changedFilesSummary = formatChangedFilesSummary(changedFiles, filePath);
  const existingCommentsSummary = formatExistingCommentsSummary(existingComments);

  return [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: [
        `PR: ${prTitle}`,
        `Description: ${description}`,
        "",
        "Changed files in this PR:",
        changedFilesSummary,
        "",
        `Current file: ${filePath}`,
        "",
        "Existing review comments on this file:",
        existingCommentsSummary,
        "",
        "Current file diff:",
        fileDiff,
      ].join("\n"),
    },
  ];
}

export function buildSuggestionPromptDiffContext(file: DiffFile): SuggestionPromptDiffContext {
  const lineAnchors = new Map<number, string>();
  const oldPath = formatPromptDiffPath("a", file.oldPath);
  const newPath = formatPromptDiffPath("b", file.newPath);
  const lines = [
    `diff --git ${oldPath} ${newPath}`,
    `status: ${file.status}`,
    `resolved path: ${getDiffFilePath(file)}`,
    `--- ${oldPath}`,
    `+++ ${newPath}`,
  ];

  for (const hunk of file.hunks) {
    lines.push(hunk.header);

    for (const line of hunk.lines) {
      const formattedLine = formatPromptDiffLine(line);
      lines.push(formattedLine);

      if (line.newLineNumber !== null && line.type !== "del") {
        lineAnchors.set(line.newLineNumber, line.content);
      }
    }
  }

  return {
    text: lines.join("\n"),
    lineAnchors,
  };
}

// ---------------------------------------------------------------------------
// Response parser
// ---------------------------------------------------------------------------

const VALID_SEVERITIES = new Set<AiSuggestionSeverity>(["critical", "warning", "suggestion"]);

/**
 * Parse the AI response into validated suggestions.
 * Strips markdown fences, validates each element individually,
 * and drops entries with invalid line numbers.
 */
export function parseSuggestionsResponse(
  raw: string,
  filePath: string,
  validLines: Set<number>,
  existingComments: ReadonlyArray<ExistingReviewComment> = [],
  lineAnchors?: ReadonlyMap<number, string>,
): AiSuggestion[] {
  const fencedMatch = raw.match(/```(?:json|markdown|md|text)?\s*([\s\S]*?)```/iu);
  let cleaned = (fencedMatch?.[1] ?? raw).trim();

  if (!cleaned.startsWith("[")) {
    const arrayStart = cleaned.indexOf("[");
    const arrayEnd = cleaned.lastIndexOf("]");

    if (arrayStart !== -1 && arrayEnd > arrayStart) {
      cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
    }
  }
  cleaned = cleaned.trim();

  const parsed: unknown = (() => {
    try {
      return JSON.parse(cleaned);
    } catch {
      return null;
    }
  })();

  if (!Array.isArray(parsed)) {
    return [];
  }

  const results: AiSuggestion[] = [];
  const existingFingerprints = buildExistingCommentFingerprints(existingComments);
  const seenFingerprints = new Set<string>();

  for (const item of parsed) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const { anchorText, line, severity, title, body } = item as Record<string, unknown>;

    if (typeof line !== "number" || !Number.isInteger(line)) {
      continue;
    }
    if (typeof severity !== "string" || !VALID_SEVERITIES.has(severity as AiSuggestionSeverity)) {
      continue;
    }
    if (typeof title !== "string" || title.length === 0) {
      continue;
    }
    if (typeof body !== "string" || body.length === 0) {
      continue;
    }

    const resolvedLine = resolveSuggestionLine(
      line,
      typeof anchorText === "string" ? anchorText : null,
      validLines,
      lineAnchors,
    );

    if (resolvedLine === null) {
      continue;
    }

    const fingerprint = buildSuggestionFingerprint(filePath, body);
    const duplicateFingerprint = buildDuplicateSuggestionFingerprint(filePath, title, body);

    if (existingFingerprints.has(fingerprint) || seenFingerprints.has(duplicateFingerprint)) {
      continue;
    }

    results.push({
      id: crypto.randomUUID(),
      path: filePath,
      line: resolvedLine,
      severity: severity as AiSuggestionSeverity,
      title,
      body,
      status: "pending",
    });
    seenFingerprints.add(duplicateFingerprint);
  }

  return results.slice(0, 5);
}

export function buildAiSuggestionsSnapshotKey(prNumber: number, rawDiff: string | null): string {
  return hashString(`${prNumber}\n---\n${rawDiff ?? ""}`);
}

export function appendAiReviewMarker(path: string, body: string): string {
  if (body.includes(DISPATCH_AI_REVIEW_MARKER_PREFIX)) {
    return body;
  }

  const trimmedBody = body.trim();
  const marker = `<!-- ${DISPATCH_AI_REVIEW_MARKER_PREFIX}${buildSuggestionFingerprint(path, body)} -->`;
  return trimmedBody.length > 0 ? `${trimmedBody}\n\n${marker}` : marker;
}

export function buildExistingCommentFingerprints(
  comments: ReadonlyArray<ExistingReviewComment>,
): Set<string> {
  const fingerprints = new Set<string>();

  for (const comment of comments) {
    const markerFingerprint = extractAiReviewMarker(comment.body);
    if (markerFingerprint) {
      fingerprints.add(markerFingerprint);
      continue;
    }

    const normalizedBody = normalizeReviewText(comment.body);
    if (!normalizedBody) {
      continue;
    }

    fingerprints.add(buildSuggestionFingerprint(comment.path, comment.body));
  }

  return fingerprints;
}

export function isSuggestionDuplicate(
  suggestion: Pick<AiSuggestion, "path" | "body">,
  existingFingerprints: ReadonlySet<string>,
): boolean {
  return existingFingerprints.has(buildSuggestionFingerprint(suggestion.path, suggestion.body));
}

/**
 * Extract the diff text for a single file from the full unified diff.
 */
export function extractFileDiff(fullDiff: string, filePath: string): string | null {
  const lines = fullDiff.split("\n");
  let capturing = false;
  const result: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      if (capturing) {
        // End of the current file section.
        break;
      }
      if (line.includes(`b/${filePath}`)) {
        capturing = true;
      }
    }
    if (capturing) {
      result.push(line);
    }
  }

  return result.length > 0 ? result.join("\n") : null;
}

/**
 * Collect all valid NEW-side line numbers from a parsed diff file's hunks.
 */
export function collectValidLines(
  hunks: Array<{ lines: Array<{ newLineNumber: number | null }> }>,
): Set<number> {
  const valid = new Set<number>();
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.newLineNumber !== null) {
        valid.add(line.newLineNumber);
      }
    }
  }
  return valid;
}

function formatPromptDiffPath(side: "a" | "b", path: string): string {
  return path === "/dev/null" ? "/dev/null" : `${side}/${path}`;
}

function formatPromptDiffLine(line: {
  type: "context" | "add" | "del" | "hunk-header";
  content: string;
  oldLineNumber: number | null;
  newLineNumber: number | null;
}): string {
  if (line.type === "hunk-header") {
    return line.content;
  }

  if (line.type === "del") {
    return `[old:${line.oldLineNumber ?? "-"} type:del] ${line.content}`;
  }

  return `[new:${line.newLineNumber ?? "-"} old:${line.oldLineNumber ?? "-"} type:${line.type}] ${line.content}`;
}

function resolveSuggestionLine(
  line: number,
  anchorText: string | null,
  validLines: ReadonlySet<number>,
  lineAnchors?: ReadonlyMap<number, string>,
): number | null {
  if (lineAnchors && anchorText) {
    const anchorResolvedLine = resolveSuggestionLineFromAnchor(line, anchorText, lineAnchors);
    if (anchorResolvedLine !== null && validLines.has(anchorResolvedLine)) {
      return anchorResolvedLine;
    }
  }

  return validLines.has(line) ? line : null;
}

function resolveSuggestionLineFromAnchor(
  line: number,
  anchorText: string,
  lineAnchors: ReadonlyMap<number, string>,
): number | null {
  const normalizedAnchorText = normalizeAnchorText(anchorText);
  if (!normalizedAnchorText) {
    return null;
  }

  const claimedLineText = lineAnchors.get(line);
  if (claimedLineText && normalizeAnchorText(claimedLineText) === normalizedAnchorText) {
    return line;
  }

  const exactMatches = findAnchorMatches(
    lineAnchors,
    (candidateText) => normalizeAnchorText(candidateText) === normalizedAnchorText,
  );
  if (exactMatches.length > 0) {
    return pickClosestLine(exactMatches, line);
  }

  if (normalizedAnchorText.length < 12) {
    return null;
  }

  const partialMatches = findAnchorMatches(lineAnchors, (candidateText) => {
    const normalizedCandidate = normalizeAnchorText(candidateText);
    return (
      normalizedCandidate.includes(normalizedAnchorText) ||
      normalizedAnchorText.includes(normalizedCandidate)
    );
  });
  if (partialMatches.length > 0) {
    return pickClosestLine(partialMatches, line);
  }

  return null;
}

function findAnchorMatches(
  lineAnchors: ReadonlyMap<number, string>,
  predicate: (candidateText: string) => boolean,
): number[] {
  const matches: number[] = [];

  for (const [candidateLine, candidateText] of lineAnchors) {
    if (predicate(candidateText)) {
      matches.push(candidateLine);
    }
  }

  return matches;
}

function pickClosestLine(lines: number[], targetLine: number): number {
  const [closestLine] = lines.toSorted((left, right) => {
    const distanceDelta = Math.abs(left - targetLine) - Math.abs(right - targetLine);
    if (distanceDelta === 0) {
      return left - right;
    }
    return distanceDelta;
  });

  return closestLine ?? targetLine;
}

function formatChangedFilesSummary(
  changedFiles: ReadonlyArray<SuggestionPromptChangedFile>,
  currentFilePath: string,
): string {
  if (changedFiles.length === 0) {
    return "- No changed-file manifest was provided.";
  }

  const visibleFiles = changedFiles.slice(0, 25);
  const rows = visibleFiles.map((file) => {
    const currentLabel = file.path === currentFilePath ? " [current]" : "";
    return `- ${file.path} (+${file.additions}, -${file.deletions})${currentLabel}`;
  });

  if (visibleFiles.length < changedFiles.length) {
    rows.push(`- … ${changedFiles.length - visibleFiles.length} more changed files`);
  }

  return rows.join("\n");
}

function formatExistingCommentsSummary(
  comments: ReadonlyArray<Pick<ExistingReviewComment, "line" | "body">>,
): string {
  if (comments.length === 0) {
    return "- None.";
  }

  const visibleComments = comments.slice(0, 8);
  const rows = visibleComments.map((comment) => {
    const linePrefix = comment.line ? `line ${comment.line}: ` : "";
    const body = collapseWhitespace(stripAiReviewMarker(comment.body)).slice(0, 220);
    return `- ${linePrefix}${body}${body.length >= 220 ? "…" : ""}`;
  });

  if (visibleComments.length < comments.length) {
    rows.push(`- … ${comments.length - visibleComments.length} more existing comments`);
  }

  return rows.join("\n");
}

function buildDuplicateSuggestionFingerprint(path: string, title: string, body: string): string {
  return hashString(
    [path.trim().toLowerCase(), normalizeReviewText(title), normalizeReviewText(body)].join(
      "\n---\n",
    ),
  );
}

function buildSuggestionFingerprint(path: string, body: string): string {
  return hashString([path.trim().toLowerCase(), normalizeReviewText(body)].join("\n---\n"));
}

function extractAiReviewMarker(body: string): string | null {
  const markerMatch = body.match(/<!--\s*dispatch-ai-review:([0-9a-f]{8})\s*-->/iu);
  return markerMatch?.[1] ?? null;
}

function stripAiReviewMarker(body: string): string {
  return body.replaceAll(/<!--\s*dispatch-ai-review:[0-9a-f]{8}\s*-->/giu, "").trim();
}

function normalizeReviewText(value: string): string {
  return collapseWhitespace(stripAiReviewMarker(value)).toLowerCase();
}

function normalizeAnchorText(value: string): string {
  return collapseWhitespace(value.replaceAll(/^[`]+|[`]+$/gu, "")).toLowerCase();
}

function collapseWhitespace(value: string): string {
  return value.replaceAll(/\s+/gu, " ").trim();
}

function hashString(value: string): string {
  let hash = FNV_OFFSET_BASIS;

  for (const character of value) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, FNV_PRIME);
  }

  return (new Uint32Array([hash])[0] ?? 0).toString(16).padStart(8, "0");
}
