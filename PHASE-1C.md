# Phase 1C: Syntax Highlighting, Inline Comments, CI Annotations & Polish

## Current State Summary

Phase 1B is complete. Here's what works end-to-end with real data:

| Feature                                                                | Status | File(s)                               |
| ---------------------------------------------------------------------- | ------ | ------------------------------------- |
| PR Inbox (real data, 30s polling, search, j/k nav)                     | DONE   | `pr-inbox.tsx`                        |
| PR Detail header (real data, 60s polling)                              | DONE   | `pr-detail-view.tsx`                  |
| Diff parser (unified diff → structured data)                           | DONE   | `diff-parser.ts` + 431 lines of tests |
| Diff viewer (virtualized, word-level highlights)                       | DONE   | `diff-viewer.tsx`                     |
| File tree sidebar (viewed checkboxes, progress bar)                    | DONE   | `file-tree.tsx`                       |
| Checks panel (real data, 10s polling, re-run failed)                   | DONE   | `checks-panel.tsx`                    |
| Log viewer (ANSI parsing, collapsible groups)                          | DONE   | `log-viewer.tsx`                      |
| Merge button (squash/merge/rebase, validates checks+reviews+conflicts) | DONE   | `pr-detail-view.tsx`                  |
| Blame-on-hover (500ms debounce, 5min cache)                            | DONE   | `blame-popover.tsx`                   |
| Review rounds (All changes / Since last review toggle)                 | DONE   | `pr-detail-view.tsx`                  |
| Keyboard shortcuts (centralized, input-aware)                          | DONE   | `use-keyboard-shortcuts.ts`           |
| Sidebar collapse (Cmd+B)                                               | DONE   | `app-layout.tsx`                      |
| Error boundary                                                         | DONE   | `app-layout.tsx`                      |
| Background noise texture                                               | DONE   | `app-layout.tsx`                      |
| PR breadcrumb in navbar                                                | DONE   | `navbar.tsx`                          |
| Side panel tabs (Checks/Reviews/Files)                                 | DONE   | `pr-detail-view.tsx`                  |

### What's Missing for MVP Completion

The app is functional but lacks the features that make it _exceptional_. These are the items that differentiate Dispatch from everything else:

1. **Syntax highlighting** — The diff viewer renders raw text. No colors. This is the single biggest visual quality gap.
2. **Inline commenting** — You can view a PR but can't leave review comments. Can't submit a review (approve/request changes/comment).
3. **CI annotations in the diff** — The flagship feature from the plan. CI errors should appear at the exact line in the diff that caused them.
4. **Blame integration into the diff viewer** — The `BlamePopover` component exists but isn't connected to the diff viewer's line hover events.
5. **Inline comment display** — Existing PR review comments from GitHub aren't shown in the diff.
6. **Toast notifications** — Merge success/failure silently succeeds or fails. No user feedback.
7. **Submit review flow** — No way to approve, request changes, or submit a review with comments.
8. **Syntax highlighting for log viewer** — CI logs have ANSI colors working, but could benefit from better visual treatment.

---

## Build Order

1. Syntax highlighting (Shiki WASM)
2. Connect blame popover to diff viewer
3. Display existing PR comments in diff
4. Inline commenting (create new comments)
5. Submit review flow
6. CI annotations in the diff
7. Toast notifications
8. Additional keyboard shortcuts
9. Final polish

---

## Step 1: Syntax Highlighting with Shiki WASM

**Install:**

```bash
bun add shiki
```

**New file:** `src/renderer/lib/highlighter.ts`

Shiki runs in the browser via WASM. Initialize it once and share across components.

```typescript
import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "json",
        "yaml",
        "toml",
        "css",
        "html",
        "markdown",
        "python",
        "go",
        "rust",
        "java",
        "ruby",
        "shell",
        "sql",
        "dockerfile",
        "graphql",
        "swift",
        "kotlin",
        "c",
        "cpp",
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Infer language from file path extension.
 */
export function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    rb: "ruby",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    sql: "sql",
    dockerfile: "dockerfile",
    graphql: "graphql",
    gql: "graphql",
    swift: "swift",
    kt: "kotlin",
    c: "c",
    cpp: "cpp",
    h: "c",
  };
  return map[ext] ?? "text";
}
```

**New hook:** `src/renderer/hooks/use-syntax-highlight.ts`

```typescript
import type { Highlighter } from "shiki";
import { useEffect, useState } from "react";
import { getHighlighter } from "../lib/highlighter";

export function useSyntaxHighlighter(): Highlighter | null {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    getHighlighter().then(setHighlighter);
  }, []);

  return highlighter;
}
```

**Modify:** `src/renderer/components/diff-viewer.tsx`

The `DiffRow` component currently renders `line.content` as plain text. Change it to render syntax-highlighted HTML.

1. Accept `highlighter` and `language` as props on `DiffViewer`.
2. In the parent `PrDetail`, use `useSyntaxHighlighter()` to get the highlighter instance, and `inferLanguage(currentFile.newPath)` for the language.
3. In `DiffRow`, if `highlighter` is available, call:
   ```typescript
   const tokens = highlighter.codeToTokens(line.content, {
     lang: language,
     theme: "github-dark-default",
   });
   ```
   Then render each token with its color via inline `style={{ color: token.color }}`.
4. If `highlighter` is still loading (null), fall back to plain text rendering (current behavior). The diff viewer works immediately, and syntax colors appear once WASM loads.
5. **Important:** Don't highlight hunk-header lines. Only highlight context, add, and del lines.
6. **Performance:** `codeToTokens` is fast (<1ms per line) but do NOT call it for lines that aren't visible. The virtualizer already handles this — only visible lines are in the DOM, so highlighting only runs for visible lines.

**Word-diff + syntax highlighting interaction:**
When word-diff segments are shown, apply syntax highlighting to the full line first, then overlay the word-diff background spans on top. The approach:

- Highlight the line to get colored tokens.
- Render the tokens.
- For "change" segments, wrap the corresponding characters in a `<span>` with the word-diff background color, preserving the token colors underneath.

This is tricky to get right. For v1, a simpler approach: when word-diff is active for a line, skip syntax highlighting for that line and just show the word-diff spans with the default text color. This is what GitHub does. Syntax highlighting + word-diff rarely matter simultaneously.

---

## Step 2: Connect Blame Popover to Diff Viewer

**Modify:** `src/renderer/components/diff-viewer.tsx`

The `BlamePopover` component and `useBlameHover()` hook exist but aren't connected.

1. In `DiffViewer`, import `useBlameHover` and `BlamePopover` from `./blame-popover`.
2. Call `const { hoveredLine, anchorRect, onLineEnter, onLineLeave } = useBlameHover()`.
3. On each `DiffRow` div, add:
   ```typescript
   onMouseEnter={(e) => {
     if (line.newLineNumber) {
       const rect = e.currentTarget.getBoundingClientRect();
       onLineEnter(line.newLineNumber, { top: rect.top, left: rect.left });
     }
   }}
   onMouseLeave={onLineLeave}
   ```
4. Render `<BlamePopover>` at the bottom of the `DiffViewer` component, passing the current file path, hovered line, git ref (use "HEAD"), and anchor rect.
5. Only show blame for context lines and add lines (not deleted lines, since those don't exist in the current file).

---

## Step 3: Display Existing PR Comments in the Diff

**New tRPC endpoint:** Add a `pr.comments` query to the router.

**Modify:** `src/main/services/gh-cli.ts`

Add a new function:

```typescript
export async function getPrComments(cwd: string, prNumber: number) {
  const { stdout } = await exec(
    `gh api repos/{owner}/{repo}/pulls/${prNumber}/comments --jq '.' --cache 60s`,
    { cwd },
  );
  return JSON.parse(stdout);
}
```

Actually, a simpler approach using `gh pr view`:

```typescript
export async function getPrReviewComments(
  cwd: string,
  prNumber: number,
): Promise<GhReviewComment[]> {
  const { stdout } = await exec(
    `gh api "repos/{owner}/{repo}/pulls/${prNumber}/comments" --paginate`,
    { cwd, timeout: 30_000 },
  );
  return JSON.parse(stdout) as GhReviewComment[];
}
```

**New type:**

```typescript
export type GhReviewComment = {
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
};
```

**Add to router:** `src/main/trpc/router.ts`

```typescript
comments: publicProcedure
  .input(z.object({ cwd: z.string(), prNumber: z.number() }))
  .query(async ({ input }) => {
    return ghCli.getPrReviewComments(input.cwd, input.prNumber);
  }),
```

**New component:** `src/renderer/components/inline-comment.tsx`

A comment bubble that renders inline in the diff, below the line it's attached to.

```typescript
type InlineCommentProps = {
  comments: GhReviewComment[]; // All comments attached to this line
};
```

- Background: `var(--bg-raised)`
- Border: `1px solid var(--border)`
- Border-left: `2px solid var(--accent)` (to distinguish from regular code)
- Padding: `8px 12px`
- Left margin: `68px` (aligned with code column, past gutter+marker)
- Author avatar (initials), author name, relative time
- Body: Render as markdown-lite (at minimum, render code blocks and backtick inline code). For v1, just render plain text.
- Reply thread: If comments have `in_reply_to_id`, group them as a thread under the parent.

**Modify:** `src/renderer/components/diff-viewer.tsx`

1. Accept a `comments` prop: `Map<string, GhReviewComment[]>` where the key is `"${path}:${line}"`.
2. In the `PrDetail` component, query `trpc.pr.comments` and build this map.
3. In the virtualizer, after each line that has comments, insert comment row(s). These rows will have variable height (not 20px), so set `estimateSize` dynamically or use `measureElement` to handle varying heights.
4. The virtualizer count becomes: total diff lines + total comment insertions.

**Important:** This changes the virtualizer's data model. Each "row" is now either a `DiffLine` or a `CommentBlock`. Define a union type:

```typescript
type VirtualRow =
  | { kind: "line"; line: FlatLine }
  | { kind: "comment"; comments: GhReviewComment[] };
```

Update `flattenLines` to accept comments and interleave them at the right positions.

---

## Step 4: Inline Commenting (Create New Comments)

**New tRPC endpoint:** Add a `pr.createComment` mutation.

**Modify:** `src/main/services/gh-cli.ts`

```typescript
export async function createReviewComment(
  cwd: string,
  prNumber: number,
  body: string,
  path: string,
  line: number,
  side: "LEFT" | "RIGHT" = "RIGHT",
): Promise<void> {
  // Use the GitHub API directly since gh doesn't have a direct comment creation command
  const token = (await exec("gh auth token", { cwd })).stdout.trim();
  const { stdout: repoInfo } = await exec(
    'gh repo view --json nameWithOwner --jq ".nameWithOwner"',
    { cwd },
  );
  const [owner, repo] = repoInfo.trim().split("/");

  // Get the latest commit SHA for the PR
  const { stdout: prJson } = await exec(
    `gh pr view ${prNumber} --json headRefOid --jq ".headRefOid"`,
    { cwd },
  );
  const commitId = prJson.trim();

  await exec(
    `gh api repos/${owner}/${repo}/pulls/${prNumber}/comments \
      -X POST \
      -f body="${body.replace(/"/g, '\\"')}" \
      -f path="${path}" \
      -F line=${line} \
      -f side="${side}" \
      -f commit_id="${commitId}"`,
    { cwd, timeout: 15_000 },
  );
}
```

**Add to router:**

```typescript
createComment: publicProcedure
  .input(z.object({
    cwd: z.string(),
    prNumber: z.number(),
    body: z.string(),
    path: z.string(),
    line: z.number(),
  }))
  .mutation(async ({ input }) => {
    await ghCli.createReviewComment(input.cwd, input.prNumber, input.body, input.path, input.line);
    return { success: true };
  }),
```

**UI: Comment composer**

**New component:** `src/renderer/components/comment-composer.tsx`

Triggered when the user clicks on a line's gutter in the diff viewer.

1. On gutter click, show a comment composer below that line (inserted into the virtual list).
2. The composer has:
   - A `<textarea>` with placeholder "Leave a comment..."
   - Font: `var(--font-sans)`, 12px
   - Background: `var(--bg-raised)`, border `var(--border)`, `var(--radius-md)`
   - Two buttons: "Cancel" (ghost) and "Add comment" (primary)
   - Keyboard: `Cmd+Enter` to submit, `Escape` to cancel
3. Support code suggestion blocks: If the user types ` ```suggestion `, auto-format it. This is a nice-to-have for v1 — just support plain text comments first.
4. On submit: Call `trpc.pr.createComment.mutate()`, then invalidate the comments query so the new comment appears inline.
5. **Pending review comments:** GitHub's review model groups comments into a "pending review" that gets submitted all at once. For v1, submit each comment individually (not as a batch review). This means comments are visible immediately, not held until review submission. This is simpler and arguably better UX for quick feedback.

**Modify diff viewer:**

1. Track `activeComposer: { fileIndex: number; lineNumber: number } | null` state in `PrDetail`.
2. When gutter is clicked, set `activeComposer` to that file+line.
3. In the virtual row list, insert a `CommentComposer` row after the target line.
4. The composer row has dynamic height — use `measureElement` from the virtualizer.

---

## Step 5: Submit Review Flow

**New tRPC endpoint:** Add a `pr.submitReview` mutation.

**Modify:** `src/main/services/gh-cli.ts`

```typescript
export async function submitReview(
  cwd: string,
  prNumber: number,
  event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT",
  body?: string,
): Promise<void> {
  let cmd = `gh pr review ${prNumber} `;
  switch (event) {
    case "APPROVE":
      cmd += "--approve";
      break;
    case "REQUEST_CHANGES":
      cmd += "--request-changes";
      break;
    case "COMMENT":
      cmd += "--comment";
      break;
  }
  if (body) {
    cmd += ` --body "${body.replace(/"/g, '\\"')}"`;
  }
  await exec(cmd, { cwd, timeout: 15_000 });
}
```

**Add to router:**

```typescript
submitReview: publicProcedure
  .input(z.object({
    cwd: z.string(),
    prNumber: z.number(),
    event: z.enum(["APPROVE", "REQUEST_CHANGES", "COMMENT"]),
    body: z.string().optional(),
  }))
  .mutation(async ({ input }) => {
    await ghCli.submitReview(input.cwd, input.prNumber, input.event, input.body);
    return { success: true };
  }),
```

**Modify:** `src/renderer/components/pr-detail-view.tsx`

Replace the simple "Merge" button in the header with a split button group:

1. **Approve button** (primary, copper): Calls `trpc.pr.submitReview` with `event: "APPROVE"`.
2. **Request Changes button** (destructive, small): Opens a small text input for the review body, then submits with `event: "REQUEST_CHANGES"`.
3. **Merge button** (success, green): Existing merge logic. Only enabled when conditions are met.

Layout in the PR header:

```
[Approve] [Request Changes ▾] [Merge ▾]
```

The "Request Changes" and "Merge" buttons can use a dropdown (coss-ui `Menu` component) for the body input / strategy selection.

After any review submission, invalidate the PR detail query so the reviews list and merge checklist update.

---

## Step 6: CI Annotations in the Diff

This is the flagship differentiator feature.

**Modify:** `src/main/services/gh-cli.ts`

Add a function to fetch check run annotations:

```typescript
export async function getCheckAnnotations(cwd: string, prNumber: number): Promise<GhAnnotation[]> {
  // Get check runs for the PR, then fetch annotations for each failing run
  const checks = await getPrChecks(cwd, prNumber);
  const failingChecks = checks.filter((c) => c.conclusion === "failure");

  const annotations: GhAnnotation[] = [];
  for (const check of failingChecks) {
    const runIdMatch = check.detailsUrl?.match(/\/runs\/(\d+)/);
    if (!runIdMatch) continue;
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

export type GhAnnotation = {
  path: string;
  startLine: number;
  endLine: number;
  level: "notice" | "warning" | "failure";
  message: string;
  title: string;
  checkName: string;
};
```

**Add to router:**

```typescript
annotations: publicProcedure
  .input(z.object({ cwd: z.string(), prNumber: z.number() }))
  .query(async ({ input }) => {
    return ghCli.getCheckAnnotations(input.cwd, input.prNumber);
  }),
```

**New component:** `src/renderer/components/ci-annotation.tsx`

The inline annotation that appears in the diff at the exact line that caused a CI failure.

Per the design system (from `dispatch-design-reference.html`):

- Background: `var(--danger-muted)` (or `warning-muted` for warnings)
- Left border: `2px solid var(--danger)`
- Padding: `8px 12px 8px 68px` (aligned with code)
- Icon: `AlertCircle` from Lucide in danger color
- Text: `font-sans` 12px, danger color
- Source line: `font-mono` 10px, `var(--text-tertiary)` — shows check name
- Re-run button: Ghost button with danger color

**Modify:** `src/renderer/components/diff-viewer.tsx`

1. Accept an `annotations` prop: `Map<string, GhAnnotation[]>` where key is `"${path}:${line}"`.
2. In `PrDetail`, query `trpc.checks.annotations` and build this map.
3. In the virtual row list, after a line that has annotations, insert an annotation row.
4. The `VirtualRow` union type expands:
   ```typescript
   type VirtualRow =
     | { kind: "line"; line: FlatLine }
     | { kind: "comment"; comments: GhReviewComment[] }
     | { kind: "annotation"; annotations: GhAnnotation[] };
   ```

**This is the killer feature.** A developer sees a CI failure badge, clicks into the diff, and the error is _right there at the line that caused it_, with a re-run button. No context switching.

---

## Step 7: Toast Notifications

**Modify:** `src/renderer/app.tsx`

Add the coss-ui toast provider at the app root:

```tsx
import { Toaster } from "@/components/ui/toast";

// In the App component, after QueryClientProvider:
<Toaster />;
```

**Modify:** All mutation call sites to show toasts on success/error:

1. **Merge** (`pr-detail-view.tsx`):
   - Success: `toast({ title: "PR merged", description: "PR #N merged. Branch deleted." })`
   - Error: `toast({ title: "Merge failed", description: error.message, variant: "destructive" })`

2. **Re-run** (`checks-panel.tsx`):
   - Success: `toast({ title: "Re-run started", description: "Failed jobs are being re-run." })`
   - Error: `toast({ title: "Re-run failed", description: error.message, variant: "destructive" })`

3. **Submit review** (new):
   - Approve: `toast({ title: "Review submitted", description: "You approved this PR." })`
   - Request changes: `toast({ title: "Changes requested" })`

4. **Create comment** (new):
   - Success: `toast({ title: "Comment added" })`

Toast styling should use the design system colors. The coss-ui Toaster component should already pick up CSS custom properties.

---

## Step 8: Additional Keyboard Shortcuts

**Modify:** `src/renderer/components/app-layout.tsx` and relevant components

Add these to the centralized shortcut system:

| Key         | Action                                       | Where                                             |
| ----------- | -------------------------------------------- | ------------------------------------------------- |
| `a`         | Approve PR                                   | When viewing a PR (triggers submitReview APPROVE) |
| `m`         | Focus merge button / trigger merge           | When viewing a PR                                 |
| `c`         | Open comment composer on focused line        | When viewing a diff                               |
| `Cmd+Enter` | Submit comment                               | When comment composer is open                     |
| `Escape`    | Close comment composer / clear search        | Context-dependent                                 |
| `e`         | Expand/collapse log viewer for focused check | When checks tab is active                         |
| `v`         | Toggle viewed state for current file         | When viewing a diff                               |
| `n`         | Jump to next unreviewed file                 | When viewing a diff                               |

These should be registered conditionally using the `when` predicate in the shortcut system.

---

## Step 9: Final Polish

1. **Loading skeletons:** Replace plain `<Spinner>` loading states in the PR detail view with skeleton placeholders that match the layout shape. Use the coss-ui `Skeleton` component. Show skeleton lines where the diff will appear, skeleton rows where the file tree will appear.

2. **Empty states for each tab:**
   - Files tab with 0 files: "No files changed" with an icon
   - Checks tab with 0 checks: "No CI checks configured" (already done)
   - Reviews tab with 0 reviews: "No reviews yet" (already done)

3. **PR size indicator in inbox:** Add a size badge (S/M/L/XL) to each PR item in the inbox based on total additions + deletions:
   - S: <50 lines
   - M: 50-200 lines
   - L: 200-500 lines
   - XL: >500 lines
     Use the neutral badge variant with mono text.

4. **File tree sorting:** Sort files in the file tree by: directory (alphabetical), then filename. Group files by top-level directory visually.

5. **Diff line hover cursor:** Add `cursor: pointer` on the gutter column to indicate that clicking will open the comment composer.

6. **Scroll to active file:** When clicking a file in the file tree, scroll the diff viewer to the top.

7. **Remember tab selection:** Persist the active side panel tab (Checks/Files/Reviews) in React state so it survives file navigation.

---

## New Files Summary

| Action | File                                           | Description                                                                             |
| ------ | ---------------------------------------------- | --------------------------------------------------------------------------------------- |
| Create | `src/renderer/lib/highlighter.ts`              | Shiki WASM initializer + language inference                                             |
| Create | `src/renderer/hooks/use-syntax-highlight.ts`   | React hook for async highlighter loading                                                |
| Create | `src/renderer/components/inline-comment.tsx`   | Renders existing PR comments inline in diff                                             |
| Create | `src/renderer/components/comment-composer.tsx` | New comment creation UI (textarea + submit)                                             |
| Create | `src/renderer/components/ci-annotation.tsx`    | CI failure annotation inline in diff                                                    |
| Modify | `src/renderer/components/diff-viewer.tsx`      | Add syntax highlighting, blame hover, comments, annotations                             |
| Modify | `src/renderer/components/pr-detail-view.tsx`   | Add approve/request changes buttons, comment state, annotation queries                  |
| Modify | `src/main/services/gh-cli.ts`                  | Add `getPrReviewComments`, `createReviewComment`, `submitReview`, `getCheckAnnotations` |
| Modify | `src/main/trpc/router.ts`                      | Add `pr.comments`, `pr.createComment`, `pr.submitReview`, `checks.annotations`          |
| Modify | `src/renderer/app.tsx`                         | Add toast provider                                                                      |

## Dependencies to Install

```bash
bun add shiki
```

---

## After This Phase

Phase 1 (MVP) will be complete. The app will be a fully functional PR review tool where you can:

1. See all PRs that need your attention (real-time inbox)
2. Review diffs with syntax highlighting, word-level changes, and blame-on-hover
3. See CI status with live polling, view logs, re-run failed jobs
4. See CI failure annotations inline at the exact line that failed
5. Leave comments on specific lines
6. Approve, request changes, or merge PRs
7. Track which files you've reviewed (persistent across restarts)
8. See only what changed since your last review
9. Navigate entirely by keyboard

Phase 2 (Workflows Dashboard, Release Management) and Phase 3 (Team Metrics, Multi-repo, Smart Notifications, Advanced AI) come next. Those are separate docs.
