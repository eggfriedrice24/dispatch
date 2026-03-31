import { describe, expect, it } from "vitest";

import {
  buildAiReviewContext,
  buildAiReviewSummaryPrompt,
  buildAiReviewSummarySnapshotKey,
  parseAiReviewConfidencePayload,
  parseAiReviewSummaryPayload,
} from "./ai-review-summary";

const BASE_INPUT = {
  prNumber: 42,
  prTitle: "Refactor PR summary cache",
  prBody: "Caches the generated AI summary.",
  author: "brayden",
  files: [
    { path: "src/a.ts", additions: 10, deletions: 2 },
    { path: "src/b.ts", additions: 4, deletions: 1 },
  ],
  diffSnippet: "line one\nline two",
};

describe("buildAiReviewSummarySnapshotKey", () => {
  it("is stable even if files are passed in a different order", () => {
    expect(
      buildAiReviewSummarySnapshotKey({
        ...BASE_INPUT,
        files: BASE_INPUT.files.toReversed(),
      }),
    ).toBe(buildAiReviewSummarySnapshotKey(BASE_INPUT));
  });

  it("changes when summary-relevant PR inputs change", () => {
    expect(
      buildAiReviewSummarySnapshotKey({
        ...BASE_INPUT,
        prBody: "Caches and invalidates the generated AI summary.",
      }),
    ).not.toBe(buildAiReviewSummarySnapshotKey(BASE_INPUT));
  });

  it("changes when the diff changes outside the old 3000-char window", () => {
    const prefix = "x".repeat(3200);

    expect(
      buildAiReviewSummarySnapshotKey({
        ...BASE_INPUT,
        diffSnippet: `${prefix}tail-a`,
      }),
    ).not.toBe(
      buildAiReviewSummarySnapshotKey({
        ...BASE_INPUT,
        diffSnippet: `${prefix}tail-b`,
      }),
    );
  });
});

describe("buildAiReviewContext", () => {
  it("covers multiple changed files instead of only the first diff chunk", () => {
    const reviewContext = buildAiReviewContext(
      {
        ...BASE_INPUT,
        diffSnippet: [
          "diff --git a/src/a.ts b/src/a.ts",
          "--- a/src/a.ts",
          "+++ b/src/a.ts",
          "@@ -1,2 +1,4 @@",
          "+const one = 1;",
          "+const two = 2;",
          "diff --git a/src/b.ts b/src/b.ts",
          "--- a/src/b.ts",
          "+++ b/src/b.ts",
          "@@ -1,2 +1,4 @@",
          "+const three = 3;",
          "+const four = 4;",
        ].join("\n"),
      },
      900,
    );

    expect(reviewContext.coveredFiles).toBe(2);
    expect(reviewContext.totalFiles).toBe(2);
    expect(reviewContext.includesWholeCodebase).toBeFalsy();
    expect(reviewContext.diffExcerpt).toContain("diff --git a/src/a.ts b/src/a.ts");
    expect(reviewContext.diffExcerpt).toContain("diff --git a/src/b.ts b/src/b.ts");
  });

  it("uses the changed-file manifest count when the diff surface is partial", () => {
    const reviewContext = buildAiReviewContext({
      ...BASE_INPUT,
      files: [...BASE_INPUT.files, { path: "src/c.ts", additions: 2, deletions: 0 }],
      diffSnippet: [
        "diff --git a/src/a.ts b/src/a.ts",
        "--- a/src/a.ts",
        "+++ b/src/a.ts",
        "@@ -1 +1 @@",
        "-const oldValue = 1;",
        "+const newValue = 2;",
      ].join("\n"),
    });

    expect(reviewContext.coveredFiles).toBe(1);
    expect(reviewContext.totalFiles).toBe(3);
    expect(reviewContext.truncated).toBeFalsy();
  });
});

describe("buildAiReviewSummaryPrompt", () => {
  it("marks oversized file manifests as partial", () => {
    const prompt = buildAiReviewSummaryPrompt({
      ...BASE_INPUT,
      files: Array.from({ length: 35 }, (_, index) => ({
        path: `src/file-${index + 1}.ts`,
        additions: 2,
        deletions: 1,
      })),
    });

    expect(prompt.userPrompt).toContain("Changed-file manifest: 30/35 files included");
    expect(prompt.userPrompt).toContain("... 5 more changed files omitted");
  });
});

describe("parseAiReviewSummaryPayload", () => {
  it("parses strict JSON payloads", () => {
    expect(
      parseAiReviewSummaryPayload(
        JSON.stringify({
          summary: "- Focus on the new cache invalidation path.",
        }),
      ),
    ).toEqual({
      summary: "- Focus on the new cache invalidation path.",
    });
  });

  it("parses fenced JSON payloads", () => {
    expect(
      parseAiReviewSummaryPayload(`\`\`\`json
{
  "summary": "- Verify the snapshot comparison."
}
\`\`\``),
    ).toEqual({
      summary: "- Verify the snapshot comparison.",
    });
  });

  it("rejects invalid payloads", () => {
    expect(parseAiReviewSummaryPayload("not json")).toBeNull();
    expect(
      parseAiReviewSummaryPayload(
        JSON.stringify({
          summary: "",
        }),
      ),
    ).toBeNull();
  });
});

describe("parseAiReviewConfidencePayload", () => {
  it("parses strict JSON confidence payloads", () => {
    expect(
      parseAiReviewConfidencePayload(
        JSON.stringify({
          confidenceScore: 78,
        }),
      ),
    ).toEqual({
      confidenceScore: 78,
    });
  });

  it("rejects invalid confidence payloads", () => {
    expect(parseAiReviewConfidencePayload("not json")).toBeNull();
    expect(
      parseAiReviewConfidencePayload(
        JSON.stringify({
          confidenceScore: 120,
        }),
      ),
    ).toBeNull();
  });
});
