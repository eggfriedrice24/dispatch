import { describe, expect, it } from "vitest";

import { computeWordDiff } from "./diff-parser";

describe("computeWordDiff", () => {
  it("marks identical lines as equal", () => {
    const result = computeWordDiff("const x = 1;", "const x = 1;");
    expect(result.oldSegments).toEqual([{ text: "const x = 1;", type: "equal" }]);
    expect(result.newSegments).toEqual([{ text: "const x = 1;", type: "equal" }]);
  });

  it("handles empty old line", () => {
    const result = computeWordDiff("", "new content");
    expect(result.oldSegments).toEqual([]);
    expect(result.newSegments).toEqual([{ text: "new content", type: "change" }]);
  });

  it("handles empty new line", () => {
    const result = computeWordDiff("old content", "");
    expect(result.oldSegments).toEqual([{ text: "old content", type: "change" }]);
    expect(result.newSegments).toEqual([]);
  });

  it("handles both empty", () => {
    const result = computeWordDiff("", "");
    expect(result.oldSegments).toEqual([]);
    expect(result.newSegments).toEqual([]);
  });

  it("detects changed word in middle", () => {
    const result = computeWordDiff("const x = 1;", "const y = 1;");
    const oldChanged = result.oldSegments.filter((s) => s.type === "change");
    const newChanged = result.newSegments.filter((s) => s.type === "change");
    expect(oldChanged.some((s) => s.text.includes("x"))).toBe(true);
    expect(newChanged.some((s) => s.text.includes("y"))).toBe(true);
  });

  it("detects appended content", () => {
    const result = computeWordDiff("hello", "hello world");
    const newChanged = result.newSegments.filter((s) => s.type === "change");
    expect(newChanged.length).toBeGreaterThan(0);
  });

  it("detects removed content", () => {
    const result = computeWordDiff("hello world", "hello");
    const oldChanged = result.oldSegments.filter((s) => s.type === "change");
    expect(oldChanged.length).toBeGreaterThan(0);
  });

  it("handles whitespace-only changes", () => {
    const result = computeWordDiff("a  b", "a b");
    expect(result.oldSegments.length).toBeGreaterThan(0);
    expect(result.newSegments.length).toBeGreaterThan(0);
  });
});
