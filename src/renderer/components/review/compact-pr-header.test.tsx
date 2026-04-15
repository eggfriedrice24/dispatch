import { getLatestApprovedReviews } from "@/renderer/components/review/compact-pr-header";
import { describe, expect, it } from "vite-plus/test";

describe("getLatestApprovedReviews", () => {
  it("excludes bot approvals from the header approver stack", () => {
    const approvedReviews = getLatestApprovedReviews(
      [
        {
          author: { login: "deploy-bot" },
          state: "APPROVED",
          submittedAt: "2026-04-01T10:00:00Z",
        },
        {
          author: { login: "alice" },
          state: "APPROVED",
          submittedAt: "2026-04-01T11:00:00Z",
        },
      ],
      (login) => login.endsWith("-bot"),
    );

    expect(approvedReviews).toEqual([
      {
        author: { login: "alice" },
        state: "APPROVED",
        submittedAt: "2026-04-01T11:00:00Z",
      },
    ]);
  });

  it("uses each reviewer's latest state before counting approvals", () => {
    const approvedReviews = getLatestApprovedReviews(
      [
        {
          author: { login: "alice" },
          state: "APPROVED",
          submittedAt: "2026-04-01T10:00:00Z",
        },
        {
          author: { login: "alice" },
          state: "COMMENTED",
          submittedAt: "2026-04-01T11:00:00Z",
        },
        {
          author: { login: "bob" },
          state: "COMMENTED",
          submittedAt: "2026-04-01T09:00:00Z",
        },
        {
          author: { login: "bob" },
          state: "APPROVED",
          submittedAt: "2026-04-01T12:00:00Z",
        },
      ],
      () => false,
    );

    expect(approvedReviews).toEqual([
      {
        author: { login: "bob" },
        state: "APPROVED",
        submittedAt: "2026-04-01T12:00:00Z",
      },
    ]);
  });
});
