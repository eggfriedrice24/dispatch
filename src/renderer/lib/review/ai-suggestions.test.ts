import {
  appendAiReviewMarker,
  buildAiSuggestionsSnapshotKey,
  buildSuggestionPrompt,
  parseSuggestionsResponse,
} from "@/renderer/lib/review/ai-suggestions";
import { describe, expect, it } from "vitest";

describe("parseSuggestionsResponse", () => {
  it("dedupes repeated suggestions in the same response", () => {
    const parsed = parseSuggestionsResponse(
      JSON.stringify([
        {
          line: 14,
          severity: "warning",
          title: "Handle undefined state",
          body: "This can throw when the value is undefined.",
        },
        {
          line: 16,
          severity: "warning",
          title: "Handle undefined state",
          body: "This can throw when the value is undefined.",
        },
      ]),
      "src/review.ts",
      new Set([14, 16]),
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.line).toBe(14);
  });

  it("filters suggestions that already exist as review comments on the same file", () => {
    const parsed = parseSuggestionsResponse(
      JSON.stringify([
        {
          line: 22,
          severity: "critical",
          title: "Missing null guard",
          body: "Guard against a missing token before calling `.trim()`.",
        },
      ]),
      "src/auth.ts",
      new Set([22]),
      [
        {
          path: "src/auth.ts",
          line: 18,
          body: "Guard against a missing token before calling `.trim()`.",
        },
      ],
    );

    expect(parsed).toEqual([]);
  });
});

describe("appendAiReviewMarker", () => {
  it("adds a hidden fingerprint marker exactly once", () => {
    const marked = appendAiReviewMarker("src/auth.ts", "Guard against a missing token.");

    expect(marked).toMatch(/<!-- dispatch-ai-review:[0-9a-f]{8} -->/u);
    expect(appendAiReviewMarker("src/auth.ts", marked)).toBe(marked);
  });
});

describe("buildAiSuggestionsSnapshotKey", () => {
  it("changes when the diff changes", () => {
    expect(buildAiSuggestionsSnapshotKey(42, "diff --git a/a.ts b/a.ts\n+one")).not.toBe(
      buildAiSuggestionsSnapshotKey(42, "diff --git a/a.ts b/a.ts\n+two"),
    );
  });
});

describe("buildSuggestionPrompt", () => {
  it("includes changed-file and existing-comment context", () => {
    const prompt = buildSuggestionPrompt(
      "Tighten auth checks",
      "Prevents nil tokens from leaking through.",
      "src/auth.ts",
      "diff --git a/src/auth.ts b/src/auth.ts",
      [
        { path: "src/auth.ts", additions: 12, deletions: 3 },
        { path: "src/session.ts", additions: 4, deletions: 0 },
      ],
      [{ line: 22, body: "We already asked for a null guard here." }],
    );

    expect(prompt[1]?.content).toContain("Changed files in this PR:");
    expect(prompt[1]?.content).toContain("src/session.ts (+4, -0)");
    expect(prompt[1]?.content).toContain("Existing review comments on this file:");
    expect(prompt[1]?.content).toContain("line 22: We already asked for a null guard here.");
  });
});
