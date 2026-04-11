import type { HandlerMap } from "./types";

import * as repo from "../db/repository";

export const reviewHandlers: Pick<
  HandlerMap,
  | "review.getLastSha"
  | "review.saveSha"
  | "review.getResumeState"
  | "review.saveResumeState"
  | "review.viewedFiles"
  | "review.setFileViewed"
  | "review.setFilesViewed"
  | "prActivity.list"
  | "prActivity.markSeen"
  | "comment.getMinimized"
  | "comment.setMinimized"
> = {
  "review.getLastSha": (args) => repo.getLastReviewedSha(args.repo, args.prNumber),
  "review.saveSha": (args) => {
    repo.saveReviewedSha(args.repo, args.prNumber, args.sha);
  },
  "review.getResumeState": (args) => repo.getResumeState(args.workspace),
  "review.saveResumeState": (args) => {
    repo.saveResumeState(args);
  },
  "review.viewedFiles": (args) => repo.getViewedFiles(args.repo, args.prNumber),
  "review.setFileViewed": (args) => {
    repo.setFileViewed(args.repo, args.prNumber, args.filePath, args.viewed);
  },
  "review.setFilesViewed": (args) => {
    repo.setFilesViewed(args);
  },
  "prActivity.list": () => Promise.resolve(repo.getPrActivityStates()),
  "prActivity.markSeen": (args) =>
    Promise.resolve(repo.markPrActivitySeen(args.repo, args.prNumber, args.updatedAt)),
  "comment.getMinimized": (args) => repo.getMinimizedComments(args.repo, args.prNumber),
  "comment.setMinimized": (args) => {
    repo.setCommentMinimized(args.repo, args.prNumber, args.commentId, args.minimized);
  },
};
