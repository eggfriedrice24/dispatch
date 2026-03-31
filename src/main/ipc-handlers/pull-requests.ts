import type { HandlerMap } from "./types";

import * as ghCli from "../services/gh-cli";

export const pullRequestHandlers: Pick<
  HandlerMap,
  | "pr.list"
  | "pr.listEnrichment"
  | "pr.detail"
  | "pr.commits"
  | "pr.diff"
  | "pr.updateTitle"
  | "pr.updateBody"
  | "pr.repoLabels"
  | "pr.addLabel"
  | "pr.removeLabel"
  | "pr.merge"
  | "pr.updateBranch"
  | "pr.close"
  | "pr.mergeQueueStatus"
  | "pr.comments"
  | "pr.replyToComment"
  | "pr.comment"
  | "pr.issueComments"
  | "pr.contributors"
  | "pr.searchUsers"
  | "pr.issuesList"
  | "pr.reviewRequests"
  | "pr.reviewThreads"
  | "pr.resolveThread"
  | "pr.unresolveThread"
  | "pr.createComment"
  | "pr.submitReview"
  | "pr.reactions"
  | "pr.addReaction"
  | "pr.removeReaction"
  | "checks.list"
  | "checks.logs"
  | "checks.rerunFailed"
  | "checks.annotations"
> = {
  "pr.list": (args) => ghCli.listPrsCore(args.cwd, args.filter, args.state, args.forceRefresh),
  "pr.listEnrichment": (args) =>
    ghCli.listPrsEnrichment(args.cwd, args.filter, args.state, args.forceRefresh),
  "pr.detail": (args) => ghCli.getPrDetail(args.cwd, args.prNumber),
  "pr.commits": (args) => ghCli.getPrCommits(args.cwd, args.prNumber),
  "pr.diff": (args) => ghCli.getPrDiff(args.cwd, args.prNumber),
  "pr.updateTitle": async (args) => {
    await ghCli.updatePrTitle(args.cwd, args.prNumber, args.title);
  },
  "pr.updateBody": async (args) => {
    await ghCli.updatePrBody(args.cwd, args.prNumber, args.body);
  },
  "pr.repoLabels": (args) => ghCli.listRepoLabels(args.cwd),
  "pr.addLabel": async (args) => {
    await ghCli.addPrLabel(args.cwd, args.prNumber, args.label);
  },
  "pr.removeLabel": async (args) => {
    await ghCli.removePrLabel(args.cwd, args.prNumber, args.label);
  },
  "pr.merge": (args) =>
    ghCli.mergePr(
      args.cwd,
      args.prNumber,
      args.strategy,
      args.admin,
      args.auto,
      args.hasMergeQueue,
    ),
  "pr.updateBranch": async (args) => {
    await ghCli.updatePrBranch(args.cwd, args.prNumber);
  },
  "pr.close": async (args) => {
    await ghCli.closePr(args.cwd, args.prNumber);
  },
  "pr.mergeQueueStatus": (args) => ghCli.getMergeQueueStatus(args.cwd, args.prNumber),
  "pr.comments": (args) => ghCli.getPrReviewComments(args.cwd, args.prNumber),
  "pr.replyToComment": async (args) => {
    await ghCli.replyToReviewComment(args.cwd, args.prNumber, args.commentId, args.body);
  },
  "pr.comment": async (args) => {
    await ghCli.createPrComment(args.cwd, args.prNumber, args.body);
  },
  "pr.issueComments": (args) => ghCli.getIssueComments(args.cwd, args.prNumber),
  "pr.contributors": (args) => ghCli.getPrContributors(args.cwd, args.prNumber),
  "pr.searchUsers": (args) => ghCli.searchUsers(args.cwd, args.query),
  "pr.issuesList": (args) => ghCli.listIssuesAndPrs(args.cwd, args.limit),
  "pr.reviewRequests": (args) => ghCli.getPrReviewRequests(args.cwd, args.prNumber),
  "pr.reviewThreads": (args) => ghCli.getPrReviewThreads(args.cwd, args.prNumber),
  "pr.resolveThread": async (args) => {
    await ghCli.resolveReviewThread(args.cwd, args.threadId);
  },
  "pr.unresolveThread": async (args) => {
    await ghCli.unresolveReviewThread(args.cwd, args.threadId);
  },
  "pr.createComment": async (args) => {
    await ghCli.createReviewComment(args);
  },
  "pr.submitReview": async (args) => {
    await ghCli.submitReview(args);
  },
  "pr.reactions": (args) => ghCli.getPrReactions(args.cwd, args.prNumber),
  "pr.addReaction": async (args) => {
    await ghCli.addReaction(args.cwd, args.subjectId, args.content);
  },
  "pr.removeReaction": async (args) => {
    await ghCli.removeReaction(args.cwd, args.subjectId, args.content);
  },
  "checks.list": (args) => ghCli.getPrChecks(args.cwd, args.prNumber),
  "checks.logs": (args) => ghCli.getRunLogs(args.cwd, args.runId),
  "checks.rerunFailed": async (args) => {
    await ghCli.rerunFailedJobs(args.cwd, args.runId);
  },
  "checks.annotations": (args) => ghCli.getCheckAnnotations(args.cwd, args.prNumber),
};
