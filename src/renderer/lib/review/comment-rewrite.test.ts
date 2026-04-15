import {
  buildCommentRewriteMessages,
  hasSelectedText,
  replaceSelection,
} from "@/renderer/lib/review/comment-rewrite";
import { describe, expect, it } from "vite-plus/test";

describe("hasSelectedText", () => {
  it("returns true when the selection spans characters", () => {
    expect(hasSelectedText({ start: 3, end: 8 })).toBeTruthy();
  });

  it("returns false for a collapsed selection", () => {
    expect(hasSelectedText({ start: 5, end: 5 })).toBeFalsy();
  });
});

describe("buildCommentRewriteMessages", () => {
  it("includes the full draft and selected passage", () => {
    const messages = buildCommentRewriteMessages(
      "This is a rough review comment.",
      "rough review comment",
    );

    expect(messages[0]?.content).toContain("Return only the rewritten replacement text");
    expect(messages[1]?.content).toContain("This is a rough review comment.");
    expect(messages[1]?.content).toContain("rough review comment");
  });
});

describe("replaceSelection", () => {
  it("replaces only the selected range and returns the new selection", () => {
    expect(replaceSelection("Please fix this wording.", { start: 7, end: 11 }, "improve ")).toEqual(
      {
        value: "Please improve this wording.",
        selection: { start: 7, end: 15 },
      },
    );
  });
});
