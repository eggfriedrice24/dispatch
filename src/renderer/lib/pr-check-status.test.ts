import { describe, expect, it } from "vitest";

import { summarizePrChecks } from "./pr-check-status";

function check(status: string, conclusion: string | null) {
  return {
    name: "CI",
    status,
    conclusion,
  };
}

describe("summarizePrChecks", () => {
  it("returns an empty summary when no checks exist", () => {
    expect(summarizePrChecks([])).toEqual({
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      neutral: 0,
      state: "none",
    });
  });

  it("marks failed checks case-insensitively", () => {
    expect(
      summarizePrChecks([
        check("COMPLETED", "FAILURE"),
        check("completed", "error"),
        check("completed", "success"),
      ]),
    ).toEqual({
      total: 3,
      passed: 1,
      failed: 2,
      pending: 0,
      neutral: 0,
      state: "failing",
    });
  });

  it("treats missing conclusions and active statuses as pending", () => {
    expect(
      summarizePrChecks([
        check("IN_PROGRESS", null),
        check("queued", null),
        check("completed", "success"),
      ]),
    ).toEqual({
      total: 3,
      passed: 1,
      failed: 0,
      pending: 2,
      neutral: 0,
      state: "pending",
    });
  });

  it("only reports passing when every check succeeds", () => {
    expect(
      summarizePrChecks([check("completed", "success"), check("completed", "success")]),
    ).toEqual({
      total: 2,
      passed: 2,
      failed: 0,
      pending: 0,
      neutral: 0,
      state: "passing",
    });
  });

  it("treats skipped and cancelled checks as neutral", () => {
    expect(
      summarizePrChecks([
        check("completed", "success"),
        check("completed", "skipped"),
        check("completed", "cancelled"),
      ]),
    ).toEqual({
      total: 3,
      passed: 1,
      failed: 0,
      pending: 0,
      neutral: 2,
      state: "neutral",
    });
  });
});
