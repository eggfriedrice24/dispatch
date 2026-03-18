import { exec, whichVersion } from "./shell";

/**
 * GitHub CLI (`gh`) adapter.
 *
 * All data fetching from GitHub goes through this service.
 * It shells out to `gh` which uses the user's existing auth token.
 */

export async function getGhVersion(): Promise<string | null> {
  return whichVersion("gh");
}

export async function isGhAuthenticated(): Promise<boolean> {
  try {
    await exec("gh auth status", { timeout: 10_000 });
    return true;
  } catch {
    return false;
  }
}

/** Raw JSON output from `gh` commands. */
function parseJsonOutput<T>(stdout: string): T {
  return JSON.parse(stdout) as T;
}

// ---------------------------------------------------------------------------
// PR operations
// ---------------------------------------------------------------------------

export interface GhPrListItem {
  number: number;
  title: string;
  author: { login: string };
  headRefName: string;
  baseRefName: string;
  reviewDecision: string;
  statusCheckRollup: Array<{
    name: string;
    status: string;
    conclusion: string | null;
  }>;
  updatedAt: string;
  url: string;
  isDraft: boolean;
  additions: number;
  deletions: number;
}

const PR_LIST_FIELDS = [
  "number",
  "title",
  "author",
  "headRefName",
  "baseRefName",
  "reviewDecision",
  "statusCheckRollup",
  "updatedAt",
  "url",
  "isDraft",
  "additions",
  "deletions",
].join(",");

export async function listPrs(
  cwd: string,
  filter: "reviewRequested" | "authored" = "reviewRequested",
): Promise<GhPrListItem[]> {
  const flag = filter === "reviewRequested" ? "--search 'review-requested:@me'" : "--author @me";
  const { stdout } = await exec(`gh pr list ${flag} --json ${PR_LIST_FIELDS} --limit 50`, { cwd });
  return parseJsonOutput<GhPrListItem[]>(stdout);
}

export interface GhPrDetail {
  number: number;
  title: string;
  body: string;
  author: { login: string };
  headRefName: string;
  baseRefName: string;
  headRefOid: string;
  reviewDecision: string;
  mergeable: string;
  statusCheckRollup: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    detailsUrl: string;
  }>;
  reviews: Array<{
    author: { login: string };
    state: string;
    submittedAt: string;
  }>;
  files: Array<{
    path: string;
    additions: number;
    deletions: number;
  }>;
  updatedAt: string;
  url: string;
  isDraft: boolean;
  additions: number;
  deletions: number;
}

const PR_DETAIL_FIELDS = [
  "number",
  "title",
  "body",
  "author",
  "headRefName",
  "baseRefName",
  "headRefOid",
  "reviewDecision",
  "mergeable",
  "statusCheckRollup",
  "reviews",
  "files",
  "updatedAt",
  "url",
  "isDraft",
  "additions",
  "deletions",
].join(",");

export async function getPrDetail(cwd: string, prNumber: number): Promise<GhPrDetail> {
  const { stdout } = await exec(`gh pr view ${prNumber} --json ${PR_DETAIL_FIELDS}`, { cwd });
  return parseJsonOutput<GhPrDetail>(stdout);
}

// ---------------------------------------------------------------------------
// PR diff
// ---------------------------------------------------------------------------

export async function getPrDiff(cwd: string, prNumber: number): Promise<string> {
  const { stdout } = await exec(`gh pr diff ${prNumber}`, { cwd });
  return stdout;
}

// ---------------------------------------------------------------------------
// CI/CD checks
// ---------------------------------------------------------------------------

export interface GhCheckRun {
  name: string;
  status: string;
  conclusion: string | null;
  detailsUrl: string;
  startedAt: string;
  completedAt: string | null;
}

export async function getPrChecks(cwd: string, prNumber: number): Promise<GhCheckRun[]> {
  const { stdout } = await exec(
    `gh pr checks ${prNumber} --json name,status,conclusion,detailsUrl,startedAt,completedAt`,
    { cwd },
  );
  return parseJsonOutput<GhCheckRun[]>(stdout);
}

export interface GhRunLog {
  jobs: Array<{
    name: string;
    steps: Array<{
      name: string;
      status: string;
      conclusion: string | null;
      number: number;
      log: string;
    }>;
  }>;
}

export async function getRunLogs(cwd: string, runId: number): Promise<string> {
  const { stdout } = await exec(`gh run view ${runId} --log`, { cwd, timeout: 60_000 });
  return stdout;
}

export async function rerunFailedJobs(cwd: string, runId: number): Promise<void> {
  await exec(`gh run rerun ${runId} --failed`, { cwd });
}

// ---------------------------------------------------------------------------
// Merge
// ---------------------------------------------------------------------------

export type MergeStrategy = "merge" | "squash" | "rebase";

export async function mergePr(
  cwd: string,
  prNumber: number,
  strategy: MergeStrategy,
): Promise<void> {
  await exec(`gh pr merge ${prNumber} --${strategy} --delete-branch`, { cwd });
}

// ---------------------------------------------------------------------------
// Review comments
// ---------------------------------------------------------------------------

export interface GhReviewComment {
  id: number;
  body: string;
  path: string;
  line: number | null;
  original_line: number | null;
  side: "LEFT" | "RIGHT";
  user: { login: string; avatar_url: string };
  created_at: string;
  updated_at: string;
  in_reply_to_id?: number;
}

export async function getPrReviewComments(
  cwd: string,
  prNumber: number,
): Promise<GhReviewComment[]> {
  const { stdout } = await exec(
    `gh api "repos/{owner}/{repo}/pulls/${prNumber}/comments" --paginate`,
    { cwd, timeout: 30_000 },
  );
  return parseJsonOutput<GhReviewComment[]>(stdout);
}

export async function createReviewComment(
  cwd: string,
  prNumber: number,
  body: string,
  path: string,
  line: number,
): Promise<void> {
  const { stdout: commitSha } = await exec(
    `gh pr view ${prNumber} --json headRefOid --jq ".headRefOid"`,
    { cwd },
  );

  await exec(
    `gh api "repos/{owner}/{repo}/pulls/${prNumber}/comments" -X POST -f body="${body.replace(/"/g, '\\"')}" -f path="${path}" -F line=${line} -f side="RIGHT" -f commit_id="${commitSha.trim()}"`,
    { cwd, timeout: 15_000 },
  );
}

// ---------------------------------------------------------------------------
// Submit review
// ---------------------------------------------------------------------------

export type ReviewEvent = "APPROVE" | "REQUEST_CHANGES" | "COMMENT";

export async function submitReview(
  cwd: string,
  prNumber: number,
  event: ReviewEvent,
  body?: string,
): Promise<void> {
  let cmd = `gh pr review ${prNumber}`;
  switch (event) {
    case "APPROVE":
      cmd += " --approve";
      break;
    case "REQUEST_CHANGES":
      cmd += " --request-changes";
      break;
    case "COMMENT":
      cmd += " --comment";
      break;
  }
  if (body) {
    cmd += ` --body "${body.replace(/"/g, '\\"')}"`;
  }
  await exec(cmd, { cwd, timeout: 15_000 });
}

// ---------------------------------------------------------------------------
// CI Annotations
// ---------------------------------------------------------------------------

export interface GhAnnotation {
  path: string;
  startLine: number;
  endLine: number;
  level: "notice" | "warning" | "failure";
  message: string;
  title: string;
  checkName: string;
}

export async function getCheckAnnotations(cwd: string, prNumber: number): Promise<GhAnnotation[]> {
  const checks = await getPrChecks(cwd, prNumber);
  const failingChecks = checks.filter((c) => c.conclusion === "failure");

  const annotations: GhAnnotation[] = [];
  for (const check of failingChecks) {
    const runIdMatch = check.detailsUrl?.match(/\/runs\/(\d+)/);
    if (!runIdMatch) {
      continue;
    }
    const runId = runIdMatch[1];

    try {
      const { stdout } = await exec(
        `gh api "repos/{owner}/{repo}/check-runs/${runId}/annotations" --paginate`,
        { cwd, timeout: 15_000 },
      );
      const parsed = JSON.parse(stdout) as Array<{
        path: string;
        start_line: number;
        end_line: number;
        annotation_level: "notice" | "warning" | "failure";
        message: string;
        title: string;
      }>;
      for (const a of parsed) {
        annotations.push({
          path: a.path,
          startLine: a.start_line,
          endLine: a.end_line,
          level: a.annotation_level,
          message: a.message,
          title: a.title,
          checkName: check.name,
        });
      }
    } catch {
      // Annotations not available for this check
    }
  }

  return annotations;
}

// ---------------------------------------------------------------------------
// Workflows
// ---------------------------------------------------------------------------

export interface GhWorkflow {
  id: number;
  name: string;
  state: "active" | "disabled_manually" | "disabled_inactivity";
}

export async function listWorkflows(cwd: string): Promise<GhWorkflow[]> {
  const { stdout } = await exec(`gh workflow list --json id,name,state --limit 50`, { cwd });
  return parseJsonOutput<GhWorkflow[]>(stdout);
}

export interface GhWorkflowRun {
  databaseId: number;
  displayTitle: string;
  name: string;
  status: string;
  conclusion: string | null;
  headBranch: string;
  createdAt: string;
  updatedAt: string;
  event: string;
  workflowName: string;
  attempt: number;
}

export async function listWorkflowRuns(
  cwd: string,
  workflowId?: number,
  limit = 20,
): Promise<GhWorkflowRun[]> {
  let cmd = `gh run list --json databaseId,displayTitle,name,status,conclusion,headBranch,createdAt,updatedAt,event,workflowName,attempt --limit ${limit}`;
  if (workflowId) {
    cmd += ` --workflow ${workflowId}`;
  }
  const { stdout } = await exec(cmd, { cwd });
  return parseJsonOutput<GhWorkflowRun[]>(stdout);
}

export interface GhWorkflowRunJob {
  name: string;
  status: string;
  conclusion: string | null;
  startedAt: string;
  completedAt: string;
  steps: Array<{
    name: string;
    status: string;
    conclusion: string | null;
    number: number;
  }>;
}

export interface GhWorkflowRunDetail extends GhWorkflowRun {
  headSha: string;
  jobs: GhWorkflowRunJob[];
}

export async function getWorkflowRunDetail(
  cwd: string,
  runId: number,
): Promise<GhWorkflowRunDetail> {
  const { stdout } = await exec(
    `gh run view ${runId} --json databaseId,displayTitle,name,status,conclusion,headBranch,headSha,createdAt,updatedAt,event,workflowName,jobs,attempt`,
    { cwd },
  );
  return parseJsonOutput<GhWorkflowRunDetail>(stdout);
}

export async function triggerWorkflow(
  cwd: string,
  workflowId: string,
  ref: string,
  inputs?: Record<string, string>,
): Promise<void> {
  let cmd = `gh workflow run ${workflowId} --ref ${ref}`;
  if (inputs) {
    for (const [key, value] of Object.entries(inputs)) {
      cmd += ` -f ${key}=${value}`;
    }
  }
  await exec(cmd, { cwd, timeout: 15_000 });
}

export async function cancelWorkflowRun(cwd: string, runId: number): Promise<void> {
  await exec(`gh run cancel ${runId}`, { cwd });
}

export async function rerunWorkflowRun(cwd: string, runId: number): Promise<void> {
  await exec(`gh run rerun ${runId}`, { cwd });
}

export async function getWorkflowYaml(cwd: string, workflowId: number): Promise<string> {
  const { stdout } = await exec(`gh workflow view ${workflowId} --yaml`, { cwd });
  return stdout;
}
