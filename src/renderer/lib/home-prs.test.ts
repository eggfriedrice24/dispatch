import type { PrCheckSummary } from "./pr-check-status";

import { describe, expect, it } from "vitest";

import {
  categorizeHomePrs,
  getDashboardPrKey,
  preferWorkspacePrs,
  type EnrichedDashboardPr,
} from "./home-prs";

const BASE_CHECK_SUMMARY: PrCheckSummary = {
  total: 0,
  passed: 0,
  failed: 0,
  pending: 0,
  neutral: 0,
  state: "none",
};

function createDashboardItem(
  overrides: Partial<EnrichedDashboardPr["pr"]> & {
    workspace?: string;
    workspacePath?: string;
    checkState?: PrCheckSummary["state"];
    mergeable?: string;
  } = {},
): EnrichedDashboardPr {
  const workspace = overrides.workspace ?? "dispatch";
  const workspacePath = overrides.workspacePath ?? `/tmp/${workspace}`;
  const checkState = overrides.checkState ?? "none";
  const mergeable = overrides.mergeable ?? "MERGEABLE";

  return {
    pr: {
      number: overrides.number ?? 42,
      title: overrides.title ?? "Example pull request",
      state: overrides.state ?? "OPEN",
      author: overrides.author ?? { login: "brayden", name: "Brayden" },
      headRefName: overrides.headRefName ?? "feature/example",
      baseRefName: overrides.baseRefName ?? "main",
      reviewDecision: overrides.reviewDecision ?? "",
      updatedAt: overrides.updatedAt ?? "2026-03-31T00:00:00.000Z",
      url: overrides.url ?? "https://example.com/pr/42",
      isDraft: overrides.isDraft ?? false,
      workspace,
      workspacePath,
      repository: overrides.repository ?? `${workspace}-owner/${workspace}`,
      pullRequestRepository: overrides.pullRequestRepository ?? `${workspace}-owner/${workspace}`,
      isForkWorkspace: overrides.isForkWorkspace ?? false,
    },
    enrichment: {
      number: overrides.number ?? 42,
      statusCheckRollup: [],
      additions: 10,
      deletions: 4,
      mergeable,
      autoMergeRequest: null,
      workspacePath,
      repository: overrides.repository ?? `${workspace}-owner/${workspace}`,
      pullRequestRepository: overrides.pullRequestRepository ?? `${workspace}-owner/${workspace}`,
      isForkWorkspace: overrides.isForkWorkspace ?? false,
    },
    checkSummary: {
      ...BASE_CHECK_SUMMARY,
      state: checkState,
    },
    hasNewActivity: false,
  };
}

function getSection(items: ReturnType<typeof categorizeHomePrs>, id: string) {
  return items.find((section) => section.id === id);
}

describe("getDashboardPrKey", () => {
  it("keeps pull requests distinct across repositories", () => {
    expect(getDashboardPrKey("/tmp/dispatch", 42)).not.toBe(getDashboardPrKey("/tmp/api", 42));
  });
});

describe("categorizeHomePrs", () => {
  it("places review-requested pull requests into attention", () => {
    const sharedPr = createDashboardItem({
      number: 310,
      workspacePath: "/tmp/dispatch",
      workspace: "dispatch",
      reviewDecision: "REVIEW_REQUIRED",
    });

    const sections = categorizeHomePrs(
      [sharedPr],
      new Set([getDashboardPrKey(sharedPr.pr.pullRequestRepository, sharedPr.pr.number)]),
      "brayden",
    );

    expect(sections.map((section) => section.id)).toEqual([
      "attention",
      "ship",
      "progress",
      "completed",
    ]);
    expect(getSection(sections, "attention")?.items).toHaveLength(1);
  });

  it("keeps different repositories with the same pull request number distinct", () => {
    const authoredPr = createDashboardItem({
      number: 123,
      workspacePath: "/tmp/dispatch",
      workspace: "dispatch",
    });
    const reviewPr = createDashboardItem({
      number: 123,
      workspacePath: "/tmp/api",
      workspace: "api",
      author: { login: "alex", name: "Alex" },
      reviewDecision: "REVIEW_REQUIRED",
    });

    const sections = categorizeHomePrs([authoredPr, reviewPr], new Set(), "brayden");

    expect(getSection(sections, "progress")?.items).toHaveLength(2);
  });

  it("keeps fork and upstream workspace entries separate when both are passed in", () => {
    const upstreamPr = createDashboardItem({
      number: 77,
      workspace: "dispatch-upstream",
      workspacePath: "/tmp/dispatch-upstream",
      repository: "acme/dispatch",
      pullRequestRepository: "acme/dispatch",
    });
    const forkPr = createDashboardItem({
      number: 77,
      workspace: "dispatch-fork",
      workspacePath: "/tmp/dispatch-fork",
      repository: "brayden/dispatch",
      pullRequestRepository: "acme/dispatch",
      isForkWorkspace: true,
    });

    const sections = categorizeHomePrs([upstreamPr, forkPr], new Set(), "brayden");

    expect(getSection(sections, "progress")?.items).toHaveLength(2);
  });

  it("puts completed pull requests into the completed section", () => {
    const mergedPr = createDashboardItem({
      number: 500,
      state: "MERGED",
    });

    const sections = categorizeHomePrs([mergedPr], new Set(), "brayden");

    expect(getSection(sections, "completed")?.items).toHaveLength(1);
  });
});

describe("preferWorkspacePrs", () => {
  it("prefers the active workspace when fork and upstream workspaces point at the same pull request repo", () => {
    const upstreamPr = createDashboardItem({
      number: 77,
      workspacePath: "/tmp/upstream",
      repository: "acme/dispatch",
      pullRequestRepository: "acme/dispatch",
    });
    const forkPr = createDashboardItem({
      number: 77,
      workspacePath: "/tmp/fork",
      repository: "brayden/dispatch",
      pullRequestRepository: "acme/dispatch",
      isForkWorkspace: true,
    });

    const [preferred] = preferWorkspacePrs([upstreamPr, forkPr], "/tmp/fork");

    expect(preferred?.pr.workspacePath).toBe("/tmp/fork");
  });
});
