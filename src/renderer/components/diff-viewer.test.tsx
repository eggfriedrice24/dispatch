import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { parseDiff } from "../lib/diff-parser";
import { DiffViewer } from "./diff-viewer";

vi.mock(import("./blame-popover"), () => ({
  BlamePopover: () => null,
  useBlameHover: () => ({
    hoveredLine: null,
    anchorRect: null,
    onLineEnter: vi.fn(),
    onLineLeave: vi.fn(),
  }),
}));

const MULTI_HUNK_DIFF = `diff --git a/src/example.ts b/src/example.ts
index abc1234..def5678 100644
--- a/src/example.ts
+++ b/src/example.ts
@@ -1,3 +1,3 @@ section-alpha
 export function alpha() {
-  return "old alpha";
+  return "new alpha";
 }
@@ -10,3 +10,3 @@ section-beta
 export function beta() {
-  return "old beta";
+  return "new beta";
 }`;

describe("DiffViewer", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders each hunk header once without extra synthetic header rows", () => {
    const file = parseDiff(MULTI_HUNK_DIFF)[0]!;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<DiffViewer file={file} />);

    expect(screen.getAllByText("@@ -1,3 +1,3 @@ section-alpha")).toHaveLength(1);
    expect(screen.getAllByText("@@ -10,3 +10,3 @@ section-beta")).toHaveLength(1);
    expect(screen.queryByText("section-alpha")).not.toBeInTheDocument();
    expect(screen.queryByText("section-beta")).not.toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '  return "new alpha";'),
    ).toBeInTheDocument();
    expect(
      screen.getByText((_, element) => element?.textContent === '  return "new beta";'),
    ).toBeInTheDocument();
    expect(
      consoleError.mock.calls.some(([message]) => String(message).includes("same key")),
    ).toBeFalsy();
  });
});
