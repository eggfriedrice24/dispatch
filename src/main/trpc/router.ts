import { z } from "zod/v4";

import * as repo from "../db/repository";
import * as ghCli from "../services/gh-cli";
import * as gitCli from "../services/git-cli";
import { whichVersion } from "../services/shell";
import { publicProcedure, router } from "./init";

// ---------------------------------------------------------------------------
// Environment check
// ---------------------------------------------------------------------------

const envRouter = router({
  check: publicProcedure.query(async () => {
    const [ghVersion, gitVersion] = await Promise.all([
      whichVersion("gh"),
      whichVersion("git"),
    ]);

    let ghAuth = false;
    if (ghVersion) {
      ghAuth = await ghCli.isGhAuthenticated();
    }

    return { ghVersion, gitVersion, ghAuth };
  }),
});

// ---------------------------------------------------------------------------
// PR operations
// ---------------------------------------------------------------------------

const prRouter = router({
  list: publicProcedure
    .input(
      z.object({
        cwd: z.string(),
        filter: z.enum(["reviewRequested", "authored"]).default("reviewRequested"),
      }),
    )
    .query(async ({ input }) => {
      return ghCli.listPrs(input.cwd, input.filter);
    }),

  detail: publicProcedure
    .input(z.object({ cwd: z.string(), prNumber: z.number() }))
    .query(async ({ input }) => {
      return ghCli.getPrDetail(input.cwd, input.prNumber);
    }),

  diff: publicProcedure
    .input(z.object({ cwd: z.string(), prNumber: z.number() }))
    .query(async ({ input }) => {
      return ghCli.getPrDiff(input.cwd, input.prNumber);
    }),

  merge: publicProcedure
    .input(
      z.object({
        cwd: z.string(),
        prNumber: z.number(),
        strategy: z.enum(["merge", "squash", "rebase"]),
      }),
    )
    .mutation(async ({ input }) => {
      await ghCli.mergePr(input.cwd, input.prNumber, input.strategy);
      return { success: true };
    }),
});

// ---------------------------------------------------------------------------
// CI/CD checks
// ---------------------------------------------------------------------------

const checksRouter = router({
  list: publicProcedure
    .input(z.object({ cwd: z.string(), prNumber: z.number() }))
    .query(async ({ input }) => {
      return ghCli.getPrChecks(input.cwd, input.prNumber);
    }),

  logs: publicProcedure
    .input(z.object({ cwd: z.string(), runId: z.number() }))
    .query(async ({ input }) => {
      return ghCli.getRunLogs(input.cwd, input.runId);
    }),

  rerunFailed: publicProcedure
    .input(z.object({ cwd: z.string(), runId: z.number() }))
    .mutation(async ({ input }) => {
      await ghCli.rerunFailedJobs(input.cwd, input.runId);
      return { success: true };
    }),
});

// ---------------------------------------------------------------------------
// Git operations
// ---------------------------------------------------------------------------

const gitRouter = router({
  blame: publicProcedure
    .input(
      z.object({
        cwd: z.string(),
        file: z.string(),
        line: z.number(),
        ref: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return gitCli.blame(input.cwd, input.file, input.line, input.ref);
    }),

  fileHistory: publicProcedure
    .input(
      z.object({
        cwd: z.string(),
        filePath: z.string(),
        limit: z.number().default(20),
      }),
    )
    .query(async ({ input }) => {
      return gitCli.fileHistory(input.cwd, input.filePath, input.limit);
    }),

  diff: publicProcedure
    .input(
      z.object({
        cwd: z.string(),
        fromRef: z.string(),
        toRef: z.string(),
      }),
    )
    .query(async ({ input }) => {
      return gitCli.diff(input.cwd, input.fromRef, input.toRef);
    }),

  repoRoot: publicProcedure
    .input(z.object({ cwd: z.string() }))
    .query(async ({ input }) => {
      return gitCli.getRepoRoot(input.cwd);
    }),
});

// ---------------------------------------------------------------------------
// Review state
// ---------------------------------------------------------------------------

const reviewRouter = router({
  getLastSha: publicProcedure
    .input(z.object({ repo: z.string(), prNumber: z.number() }))
    .query(({ input }) => {
      return repo.getLastReviewedSha(input.repo, input.prNumber);
    }),

  saveSha: publicProcedure
    .input(z.object({ repo: z.string(), prNumber: z.number(), sha: z.string() }))
    .mutation(({ input }) => {
      repo.saveReviewedSha(input.repo, input.prNumber, input.sha);
      return { success: true };
    }),

  viewedFiles: publicProcedure
    .input(z.object({ repo: z.string(), prNumber: z.number() }))
    .query(({ input }) => {
      return repo.getViewedFiles(input.repo, input.prNumber);
    }),

  setFileViewed: publicProcedure
    .input(
      z.object({
        repo: z.string(),
        prNumber: z.number(),
        filePath: z.string(),
        viewed: z.boolean(),
      }),
    )
    .mutation(({ input }) => {
      repo.setFileViewed(input.repo, input.prNumber, input.filePath, input.viewed);
      return { success: true };
    }),
});

// ---------------------------------------------------------------------------
// Root router
// ---------------------------------------------------------------------------

export const appRouter = router({
  env: envRouter,
  pr: prRouter,
  checks: checksRouter,
  git: gitRouter,
  review: reviewRouter,
});

export type AppRouter = typeof appRouter;
