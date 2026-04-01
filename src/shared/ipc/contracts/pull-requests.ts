import type {
  GhAnnotation,
  GhCheckRun,
  GhPrDetail,
  GhPrEnrichment,
  GhPrListItemCore,
  GhPrReactions,
  GhReactionContent,
  GhReviewComment,
  GhReviewRequest,
  GhReviewThread,
} from "../../ipc";

export interface PullRequestIpcApi {
  "pr.list": {
    args: {
      cwd: string;
      filter: "reviewRequested" | "authored" | "all";
      state?: "open" | "closed" | "merged" | "all";
      forceRefresh?: boolean;
    };
    result: GhPrListItemCore[];
  };
  "pr.listEnrichment": {
    args: {
      cwd: string;
      filter: "reviewRequested" | "authored" | "all";
      state?: "open" | "closed" | "merged" | "all";
      forceRefresh?: boolean;
    };
    result: GhPrEnrichment[];
  };
  "pr.detail": { args: { cwd: string; prNumber: number }; result: GhPrDetail };
  "pr.commits": {
    args: { cwd: string; prNumber: number };
    result: Array<{ oid: string; message: string; author: string; committedDate: string }>;
  };
  "pr.diff": { args: { cwd: string; prNumber: number }; result: string };
  "pr.updateTitle": {
    args: { cwd: string; prNumber: number; title: string };
    result: void;
  };
  "pr.updateBody": {
    args: { cwd: string; prNumber: number; body: string };
    result: void;
  };
  "pr.repoLabels": {
    args: { cwd: string };
    result: Array<{ name: string; color: string; description: string }>;
  };
  "pr.addLabel": {
    args: { cwd: string; prNumber: number; label: string };
    result: void;
  };
  "pr.removeLabel": {
    args: { cwd: string; prNumber: number; label: string };
    result: void;
  };
  "pr.merge": {
    args: {
      cwd: string;
      prNumber: number;
      strategy: "merge" | "squash" | "rebase";
      admin?: boolean;
      auto?: boolean;
      hasMergeQueue?: boolean;
    };
    result: { queued: boolean };
  };
  "pr.updateBranch": {
    args: { cwd: string; prNumber: number };
    result: void;
  };
  "pr.close": {
    args: { cwd: string; prNumber: number };
    result: void;
  };
  "pr.mergeQueueStatus": {
    args: { cwd: string; prNumber: number };
    result: {
      inQueue: boolean;
      position: number | null;
      state: string | null;
      estimatedTimeToMerge: number | null;
    } | null;
  };
  "pr.comments": { args: { cwd: string; prNumber: number }; result: GhReviewComment[] };
  "pr.createComment": {
    args: {
      cwd: string;
      prNumber: number;
      body: string;
      path: string;
      line: number;
      side?: "LEFT" | "RIGHT";
      startLine?: number;
      startSide?: "LEFT" | "RIGHT";
    };
    result: void;
  };
  "pr.comment": { args: { cwd: string; prNumber: number; body: string }; result: void };
  "pr.issueComments": {
    args: { cwd: string; prNumber: number };
    result: Array<{
      id: string;
      body: string;
      author: { login: string };
      createdAt: string;
    }>;
  };
  "pr.contributors": {
    args: { cwd: string; prNumber: number };
    result: string[];
  };
  "pr.searchUsers": {
    args: { cwd: string; query: string };
    result: Array<{ login: string; name: string | null }>;
  };
  "pr.issuesList": {
    args: { cwd: string; limit?: number };
    result: Array<{
      number: number;
      title: string;
      state: string;
      isPr: boolean;
    }>;
  };
  "pr.replyToComment": {
    args: { cwd: string; prNumber: number; commentId: number; body: string };
    result: void;
  };
  "pr.reviewRequests": {
    args: { cwd: string; prNumber: number };
    result: GhReviewRequest[];
  };
  "pr.reviewThreads": {
    args: { cwd: string; prNumber: number };
    result: GhReviewThread[];
  };
  "pr.resolveThread": { args: { cwd: string; threadId: string }; result: void };
  "pr.unresolveThread": { args: { cwd: string; threadId: string }; result: void };
  "pr.submitReview": {
    args: {
      cwd: string;
      prNumber: number;
      event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT";
      body?: string;
    };
    result: void;
  };
  "pr.reactions": { args: { cwd: string; prNumber: number }; result: GhPrReactions };
  "pr.addReaction": {
    args: { cwd: string; subjectId: string; content: GhReactionContent };
    result: void;
  };
  "pr.removeReaction": {
    args: { cwd: string; subjectId: string; content: GhReactionContent };
    result: void;
  };

  "checks.list": { args: { cwd: string; prNumber: number }; result: GhCheckRun[] };
  "checks.logs": { args: { cwd: string; runId: number }; result: string };
  "checks.rerunFailed": { args: { cwd: string; runId: number }; result: void };
  "checks.annotations": { args: { cwd: string; prNumber: number }; result: GhAnnotation[] };
}
