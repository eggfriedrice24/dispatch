import type { PrActivityState } from "../../ipc";

export interface ReviewStateIpcApi {
  "review.getLastSha": { args: { repo: string; prNumber: number }; result: string | null };
  "review.saveSha": { args: { repo: string; prNumber: number; sha: string }; result: void };
  "review.viewedFiles": { args: { repo: string; prNumber: number }; result: string[] };
  "review.setFileViewed": {
    args: { repo: string; prNumber: number; filePath: string; viewed: boolean };
    result: void;
  };
  "review.setFilesViewed": {
    args: { repo: string; prNumber: number; filePaths: string[]; viewed: boolean };
    result: void;
  };
  "prActivity.list": { args: void; result: PrActivityState[] };
  "prActivity.markSeen": {
    args: { repo: string; prNumber: number; updatedAt: string };
    result: void;
  };
  "comment.getMinimized": {
    args: { repo: string; prNumber: number };
    result: string[];
  };
  "comment.setMinimized": {
    args: { repo: string; prNumber: number; commentId: string; minimized: boolean };
    result: void;
  };
}
