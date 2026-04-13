import { describe, expect, it } from "vitest";

import { getReviewPositionKey } from "./review-position";

describe("getReviewPositionKey", () => {
  it("builds key from path, line, and side", () => {
    expect(getReviewPositionKey("src/main.ts", 42, "RIGHT")).toBe("src/main.ts:RIGHT:42");
  });

  it("distinguishes LEFT and RIGHT sides", () => {
    const left = getReviewPositionKey("file.ts", 10, "LEFT");
    const right = getReviewPositionKey("file.ts", 10, "RIGHT");
    expect(left).not.toBe(right);
  });

  it("handles paths with special characters", () => {
    expect(getReviewPositionKey("src/components/ui/button.tsx", 1, "LEFT")).toBe(
      "src/components/ui/button.tsx:LEFT:1",
    );
  });
});
