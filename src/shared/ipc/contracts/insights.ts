import type { GhPrEnrichment, GhPrListItemCore } from "../../ipc";

export interface InsightsIpcApi {
  "pr.listAll": {
    args: {
      filter: "reviewRequested" | "authored" | "all";
      state?: "open" | "closed" | "merged" | "all";
    };
    result: Array<
      GhPrListItemCore & {
        workspace: string;
        workspacePath: string;
        repository: string;
        pullRequestRepository: string;
        isForkWorkspace: boolean;
      }
    >;
  };
  "pr.listAllEnrichment": {
    args: {
      filter: "reviewRequested" | "authored" | "all";
      state?: "open" | "closed" | "merged" | "all";
    };
    result: Array<
      GhPrEnrichment & {
        workspacePath: string;
        repository: string;
        pullRequestRepository: string;
        isForkWorkspace: boolean;
      }
    >;
  };
  "metrics.prCycleTime": {
    args: { cwd: string; since: string };
    result: Array<{
      prNumber: number;
      title: string;
      author: string;
      createdAt: string;
      mergedAt: string | null;
      firstReviewAt: string | null;
      timeToFirstReview: number | null;
      timeToMerge: number | null;
      additions: number;
      deletions: number;
    }>;
  };
  "metrics.reviewLoad": {
    args: { cwd: string; since: string };
    result: Array<{
      reviewer: string;
      reviewCount: number;
      avgResponseTime: number;
    }>;
  };
  "releases.list": {
    args: { cwd: string; limit?: number };
    result: Array<{
      tagName: string;
      name: string;
      body: string;
      isDraft: boolean;
      isPrerelease: boolean;
      createdAt: string;
      author: { login: string };
    }>;
  };
  "releases.create": {
    args: {
      cwd: string;
      tagName: string;
      name: string;
      body: string;
      isDraft: boolean;
      isPrerelease: boolean;
      target: string;
    };
    result: { url: string };
  };
  "releases.generateChangelog": {
    args: { cwd: string; sinceTag: string };
    result: string;
  };
}
