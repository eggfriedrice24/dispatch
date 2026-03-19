# Dispatch — Mission & Context

## What This Is

Dispatch is a desktop application (Electron) for reviewing GitHub pull requests, managing CI/CD workflows, and shipping code with confidence. It is not a web app, not a SaaS, and not a GitHub clone. It is a native tool that sits on the developer's machine and talks to GitHub through the `gh` CLI and local `git`.

## The Problem We Solve

The developer workflow has shifted. AI coding agents (Cursor, Claude Code, Copilot, Codex) generate more code than humans. The bottleneck is no longer _writing_ code — it's _reviewing, verifying, and shipping_ it.

But the tools haven't kept up. The pull request lifecycle is fragmented across multiple tabs and services:

- You review a PR on GitHub (or Graphite), then open a separate tab to check CI status
- CI fails, but you can't see _which code_ caused the failure without clicking through 3 pages of GitHub Actions UI
- You merge, then switch to a deployment dashboard to see if it reached production
- Your team runs release workflows manually from GitHub's Actions tab
- You have no blame context during review without opening your editor separately
- You can't see what changed since your last review without mental gymnastics

**Nobody has unified code review, CI/CD, and deployment into a single surface.** That's what Dispatch does.

## The Core Thesis

> The pull request is the new unit of work. Build the best PR command center on the planet — one that treats code review, CI/CD, and deployment as a single integrated workflow — and deliver it as a desktop app that's enterprise-ready from day one.

## Why Desktop (Electron + `gh` CLI)

This is our most important architectural decision. It's not just a technical choice — it's the product differentiation.

1. **`gh` CLI as the data layer.** The user already has `gh auth login` configured. We use their existing token, scopes, and rate limit budget. Zero OAuth dance, zero server infrastructure, zero token storage. Every competitor (Graphite, Better Hub) runs servers to proxy GitHub's API. We don't.

2. **Local git access.** We run `git blame`, `git log`, `git diff` directly on the user's repo clone. This gives us blame-on-hover, file history, and local diff computation — things no web app can do without a server computing them. This is a genuine moat.

3. **Enterprise adoption without procurement.** No SaaS contract. No data leaving the org. IT can evaluate it in a week. This is how VS Code won.

4. **Native performance.** Virtualized diff rendering, system notifications, global keyboard shortcuts, menu bar presence. Desktop apps that are built well feel fundamentally better than web apps.

5. **Zero infrastructure cost.** No servers, no Redis, no Postgres, no hosting bill. The user's machine is the compute. This means: faster time to market, lower operating costs, and the ability to undercut competitors on price.

**The constraint:** The user must have the repo cloned locally for blame and file history. In practice, engineers reviewing PRs almost always have the repo cloned. If they don't, we gracefully degrade — everything works via `gh` except blame and history.

## Who We Compete Against

| Competitor     | Their Strength                                                   | Our Advantage                                                                                         |
| -------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| **GitHub**     | The platform of record, 100M+ users                              | Their PR page hasn't changed in years. We're faster, keyboard-driven, CI-integrated                   |
| **Graphite**   | Stacked PRs, merge queue, $52M funding, Cursor agent integration | They're SaaS ($40/user/month). We're desktop (free/cheap). They don't integrate CI into review. We do |
| **CodeRabbit** | Automated AI review, 2M repos                                    | They're automated review. We're human review UX. Complementary, not competitive                       |
| **Linear**     | Issue tracking, just launched "Diffs" for code review            | Their diffs are a feature inside a PM tool. We're a dedicated tool with depth they won't match        |
| **Aviator**    | Merge queue, stacked PRs, FlexReview, releases                   | Infrastructure layer. We're the UX layer. Could integrate rather than compete                         |
| **Better Hub** | Beautiful GitHub frontend, AI chat                               | 100% GitHub API proxy. Fragile architecture. No git blame, no write Actions, no CI integration        |

**Our positioning:** We don't compete on stacking (Graphite), automated review (CodeRabbit), project management (Linear), or merge queues (Aviator). We compete on **the quality of the human review experience** and **CI/CD integration** — the gap nobody has filled.

## What We Are NOT

- **Not a git hosting service.** GitHub hosts repos. We make them reviewable.
- **Not a code editor.** Cursor and VS Code own that. We don't edit files.
- **Not a stacking tool.** Graphite owns stacked PRs. We display stacked PRs if detected, but don't manage them.
- **Not a merge queue.** We call `gh pr merge`. If you want queue behavior, use Graphite or Aviator.
- **Not an automated reviewer.** We don't post bot comments. CodeRabbit does that. We help _humans_ review.
- **Not a web app.** Desktop-only. This is a feature, not a limitation.
- **Not a project management tool.** No issues, no boards, no sprints. We link to Linear/Jira, not replace them.

## Design Language: "Warm Precision"

The full design system is in `DISPATCH-DESIGN-SYSTEM.md`. The summary:

- **Warm dark surfaces** (`#08080a` root, warm-tinted, not cold zinc)
- **Copper accent** (`#d4883a`) — our signature color. Used for primary actions, active states, logo
- **Warm off-white text** (`#f0ece6`, not sterile `#fafafa`)
- **Editorial typography** — Instrument Serif (italic) for display, DM Sans for body, JetBrains Mono for code
- **Confident geometry** — 4-8px radius (not brutalist 0px, not bubbly 16px)
- **Dense but not cramped** — 42px navbar, 12px body text, tight spacing
- **Keyboard-first** — every action has a keybinding, shown inline in the UI
- **Subtle noise texture** — barely-perceptible grain overlay prevents surfaces from feeling flat
- **2px copper gradient bar** at the top of the window — instant brand recognition

The feeling: a well-made leather workshop tool, not a sterile lab and not a consumer toy.

## Architecture

```
Electron Main Process (Node.js)
├── IPC Handler (24 typed endpoints)
├── gh CLI adapter (shells to `gh` for all GitHub operations)
├── git CLI adapter (shells to `git` for blame, log, diff)
├── SQLite database (review state, viewed files, preferences, workspaces)
└── Shell utility (child_process exec wrapper)

Electron Renderer (React 19 + Tailwind 4)
├── Typed IPC client (type-safe calls to main process)
├── React Query (caching, polling, invalidation)
├── Shiki WASM (syntax highlighting in the browser)
├── @tanstack/react-virtual (virtualized diff rendering)
├── coss-ui component library (51 base components)
└── Custom components (inbox, diff viewer, checks panel, etc.)
```

Communication between main and renderer uses a single typed IPC channel with a contract defined in `src/shared/ipc.ts`. No tRPC, no HTTP, no WebSocket. Direct Electron IPC.

## Feature Phases

### Phase 1 (MVP) — COMPLETE

The full PR review lifecycle:

- PR inbox with real-time polling, search, keyboard navigation
- Virtualized diff viewer with syntax highlighting, word-level diffs, blame-on-hover
- Inline PR comments (view existing + create new)
- CI annotations inline in the diff (errors at the exact failing line)
- Checks panel with live status, log viewer, re-run failed jobs
- Approve + merge flow with pre-merge checklist
- Review rounds (all changes / since last review)
- File tracking (viewed checkboxes, persistent across restarts)

### Phase 2 — IN PROGRESS

CI/CD workflow management + production readiness:

- Workflows dashboard (list runs, trigger workflows, Gantt job timelines)
- Run comparison (side-by-side duration deltas — a novel feature)
- Workspace switcher (multi-repo without re-onboarding)
- Desktop notifications (new review request, CI failure, approval)
- Settings panel, system tray / dock badge
- Phase 1 cleanup (request changes button, merge strategy selector, loading skeletons, keyboard shortcut consolidation)

### Phase 3 — PLANNED

Team intelligence + AI:

- Multi-repo unified inbox
- Team metrics (cycle time, review latency, PR size trends)
- AI inline explanations (select code → "Explain this change")
- AI review summaries (grouped by logical concern)
- Release management (changelog generation, deployment pipeline)
- Smart notifications (configurable rules, snooze, mute)

## Key Files

| File                                      | Purpose                                                                                      |
| ----------------------------------------- | -------------------------------------------------------------------------------------------- |
| `MISSION.md`                              | This file. Why we exist and what we're building                                              |
| `DISPATCH-DESIGN-SYSTEM.md`               | Complete visual design spec (666 lines). Every color, font, spacing value, component pattern |
| `SPEC.md`                                 | Phase 1 MVP specification                                                                    |
| `PHASE-1B.md`                             | Phase 1B implementation plan (wire UI to real data, build core components)                   |
| `PHASE-1C.md`                             | Phase 1C implementation plan (syntax highlighting, comments, CI annotations, polish)         |
| `PHASE-2.md`                              | Phase 2 implementation plan (workflows dashboard, notifications, settings)                   |
| `src/shared/ipc.ts`                       | The typed IPC contract — all 24+ endpoints defined here. This is the API surface             |
| `src/main/services/gh-cli.ts`             | GitHub CLI adapter — every `gh` command we use                                               |
| `src/main/services/git-cli.ts`            | Git CLI adapter — blame, log, diff                                                           |
| `src/renderer/lib/diff-parser.ts`         | Unified diff parser (string → structured data)                                               |
| `src/renderer/components/diff-viewer.tsx` | The most important UI component — virtualized diff rendering                                 |

## Principles for Continuation

If you are an AI continuing this work:

1. **Use real data.** Every component must call the IPC layer. No hardcoded placeholders. No mock data. The backend is complete — use it.

2. **Follow the design system.** `DISPATCH-DESIGN-SYSTEM.md` is the bible. Use the exact CSS custom properties defined there. Don't invent new colors, fonts, or spacing values.

3. **Keyboard-first.** Every new interactive feature needs a keybinding. Use the `useKeyboardShortcuts` hook in `src/renderer/hooks/use-keyboard-shortcuts.ts`.

4. **Desktop-native.** Use Electron APIs where they improve the experience — native dialogs, notifications, menu bar, dock badge. Don't build web-style alternatives.

5. **The `gh` CLI is the primary data source.** All GitHub data comes from shelling out to `gh`. Don't add `@octokit/rest` or direct API calls unless `gh` literally can't do something. The `gh` CLI handles auth, pagination, caching, and rate limiting for us.

6. **Local git for the moat features.** Blame, file history, and local diff computation are our desktop advantage. These use `git` directly via `src/main/services/git-cli.ts`.

7. **SQLite for persistence.** Review state, viewed files, preferences, and workspaces live in SQLite at `userData/dispatch.db`. Use the repository layer in `src/main/db/repository.ts`.

8. **No servers. No cloud. No SaaS.** Everything runs on the user's machine. We never see their code. This is non-negotiable for enterprise adoption.

9. **Ship quality.** Tests exist and should be maintained. The CI pipeline runs lint, format check, typecheck, test, and build. Don't skip checks.

10. **Read the phase docs.** Before building anything, read the relevant phase doc (`PHASE-1B.md`, `PHASE-1C.md`, `PHASE-2.md`). They contain the exact specifications, file paths, component interfaces, and behavioral details for each feature.
