# PR Review UI Redesign — Design Blueprint

> Based on mockup iterations v6–v14. The final interactive prototype is `mockup-pr-review-v14.html`.

---

## Vision

Dispatch is intelligence-first code review. Every competitor shows diffs — Dispatch helps you understand them. The sidebar triages files by what needs your attention, AI comments explain failure modes with severity tags and one-click fixes, and the UI adapts to context.

## Design Principles (specific to this redesign)

1. **The diff is king.** Maximize code space. Header is one compact 36px strip. Side panel is an overlay, not always visible. Floating bar keeps actions accessible without stealing vertical space.
2. **Show what matters, hide what doesn't.** Triage groups files by attention needed. Low-risk files collapse. Solo devs get no side panel. Draft PRs get no merge controls.
3. **AI is a first-class participant, not noise.** Bot comments have severity tags (Critical/Suggestion/Nitpick), explain failure modes, and offer one-click Apply fixes. They're visually distinct but not louder than human comments.
4. **No generic patterns.** No colored-left-border cards. No rings around avatars. Status events in conversation are compact one-liners, not full cards. Every visual choice should feel intentional, not templated.

---

## Layout Architecture

```
┌─ Accent bar (2px copper gradient) ────────────────────────────┐
├─ Navbar (42px) ───────────────────────────────────────────────┤
│  Logo mark (d) · Tabs (Review/Workflows/Metrics/Releases)    │
│  · Spacer · Bell · Settings · Avatar                          │
├───────────────────────────────────────────────────────────────┤
│  Sidebar (260px review / 300px inbox)  │  Content panel       │
│                                        │                      │
│  [Queue zone]                          │  Header (36px)       │
│  [Triage|Tree] + File tree             │  Diff toolbar (32px) │
│  [Merge readiness card]                │  Diff viewer (flex)  │
│                                        │                      │
│                                        │  [Side panel overlay]│
│                                        │  [Floating bar]      │
└────────────────────────────────────────┴──────────────────────┘
```

### Two primary states

**Inbox** — 300px sidebar with search, filter pills, grouped PR list. Main content shows empty state with recent activity ghost items.

**Review** — 260px sidebar with queue zone + file navigation. Main content shows compact header, diff toolbar, diff viewer. Side panel toggles as overlay. Floating review bar at bottom.

---

## Component Specifications

### Navbar (42px)

- Logo mark: 20x20px copper square, border-radius 4px, Instrument Serif italic "d" centered
- Tabs: 12px, font-weight 450, active tab has 2px accent underline (20px wide, centered below)
- Tab counts: mono 10px, accent-muted pill background
- Icon buttons: 30x30px, radius 6px, tertiary color, raised bg on hover
- Avatar: 24x24px circle, copper gradient, initials

### Sidebar — Inbox (300px)

- Title row: "Review" (14px, 600) + repo dropdown badge (mono 10px, raised bg, border)
- Search: bg-raised input with search icon left, `/` kbd hint right
- Filter pills: segmented control (bg-raised container, 2px padding, active pill gets bg-elevated + shadow)
- PR list sections: "Needs your review" / "Reviewed" with 5px colored dot + uppercase 10px label
- PR items: 8px padding, 2px left border (transparent, accent when selected), status dot (8px), title (12px, 500), meta row (#number, author, check badge), right column (time, size badge)
- Selected PR: accent-muted bg, accent left border

### Sidebar — Review (260px)

**Queue zone** (top, collapsible):

- Back arrow + "Queue" text (11px, tertiary)
- "N to review" label (10px, uppercase, ghost)
- Compact PR items: 6px dot, title (11px, 450), #number. Active gets accent-muted bg + accent left border.

**File navigation:**

- `VIEW` label (9px, uppercase, ghost, letter-spacing 0.06em) + `[Triage | Tree]` segmented toggle
- Active toggle button: accent-muted background (ties to brand identity)
- Progress: "2 files need attention" (accent-text color) in Triage mode, "3/10 viewed" in Tree mode
- File search: bg-raised input with search icon

**Triage mode** — files grouped into sections:

- Section headers: 10px uppercase, colored dot (orange=attention, blue=changed, gray=low-risk), chevron (rotates on collapse), count on right
- File items: 11px, file badge (M/A/D, 12x12px, colored bg), mono filename (10px), comment count badge (warning-muted), +/- stats
- Active file: accent-muted bg, inset box-shadow `inset 2px 0 0 var(--accent), 0 0 8px rgba(212,136,58,0.05)`
- Viewed files: 0.5 opacity
- **File annotations** (below filename): attention files get `text-secondary, normal style, font-weight 450`. Other files get `text-tertiary, italic`. Creates subtle hierarchy.

**Tree mode** — flat hierarchical tree, no sections, no annotations. Same file items but organized by directory.

**Merge readiness card** (bottom):

- bg-raised, radius-lg, margin 6px, padding 8px 10px
- Dot progress row: 3 small dots (6px), green for met, yellow for pending
- Checklist items: 10px, check/warning icons, label text

### PR Header (36px, single strip)

- Avatar: 20x20px circle, gradient bg, initials (9px, 600)
- Draft badge (when applicable): warning-muted bg, warning text, 10px 600
- PR title: **14px, font-weight 700** — most prominent text on screen
- PR number: mono 11px, tertiary
- Meta: branch badge (mono 10px, accent-text, raised bg), arrow, base branch, separator, +/- stats
- "You" badge: info-muted bg, info color, 9px
- Right side: external link icon btn, **panel toggle icon btn** (active state = accent-muted bg, accent-text, accent border)

### Diff Toolbar (32px)

- File path: mono 11px, 500 weight. Directory portion in tertiary, filename in secondary.
- "Since review" callout (when applicable): purple-muted pill with tiny avatar, description text, "Show all changes" link
- Unified/Split toggle group: bg-raised container, active button gets bg-elevated + shadow
- Viewed toggle: bg-raised, border, "Viewed" text + `v` kbd hint. Toggles checked state (accent-muted bg, accent-text, accent border)
- File nav: arrow buttons (20x20px, bg-raised, border) + "N/N" count

### Diff Viewer

- Table layout: gutter (22px each, right-aligned, ghost color, 11px), marker (16px, centered, 11px 600), code (12.5px, line-height 20px)
- **Hover**: `filter: brightness(1.15)` on row + subtle `box-shadow: inset 2px 0 0 rgba(212,136,58,0.15)` on first gutter td
- Added lines: diff-add-bg, marker in success color
- Deleted lines: diff-del-bg, marker in danger color
- Word-level highlights: diff-add-word / diff-del-word with 2px radius
- Hunk headers: diff-hunk-bg, info color, 11px

### Inline Comments — Human

- bg-surface, border top/bottom
- Padding-left: 68px (aligns body with code)
- Avatar: 18px circle, gradient bg, initials
- Author: 12px, 500. Time: mono 10px, tertiary.
- Body: 12px, secondary, line-height 1.5. Code in bg-elevated, mono 11px.
- Actions: Reply (ghost btn), Resolve icon (margin-left auto, ghost → success on hover)

### Inline Comments — AI Bot

- Same layout as human but:
- 2px accent left border, `rgba(212,136,58,0.03)` background tint
- Avatar: 20px, accent-muted bg, accent border, sparkle icon
- Name in accent-text
- "Bot" badge: 9px uppercase, accent-muted bg, accent-text, accent border
- **Severity badge**: 9px uppercase, 700 weight. "Critical" = danger-muted/danger. "Suggestion" = warning-muted/warning. "Nitpick" = bg-raised/text-tertiary.
- Collapse chevron: margin-left auto, ghost color

### Suggestion Block (inside bot comments)

- success-tinted bg `rgba(61,214,140,0.06)`, success border `rgba(61,214,140,0.15)`, radius 6px
- Header: check icon, "Suggested fix" (10px, 600, success), spacer, **Apply button** (11px, 600, success bg, dark text, `padding: 3px 12px`, hover glow `0 0 8px rgba(61,214,140,0.2)`)
- Code: mono 11px, line-height 18px. Deleted line: danger color, line-through, 0.7 opacity. Added line: success color.

### CI Annotation (inline in diff)

- 3px danger left border, `rgba(239,100,97,0.06)` bg
- Padding-left: 66px (aligns with code)
- Header: XCircle icon, "CI / Typecheck — error TS2532" (11px, 600, danger)
- Body: mono 11px, secondary

### Floating Review Bar

- Absolutely positioned: bottom 12px, centered horizontally
- **Frosted glass**: `backdrop-filter: blur(12px)`, `background: rgba(28,28,34,0.85)`
- Border: border-strong. Radius: xl. Shadow: shadow-lg + shadow-glow.
- Padding: 5px 5px 5px 12px
- Stats: icon (tertiary) + value (mono 10px, primary). Green values for passing checks.
- **"N pending" pill**: accent-muted bg, accent-text, mono 10px, radius-full. Only visible when user has uncommitted inline comments.
- Separator: 1px border, 18px tall
- Buttons: Request Changes (outline + kbd hint), Approve (success bg, dark text + kbd), Squash & Merge (primary copper + merge icon)
- Author/draft mode: merge button disabled (opacity 0.4), "Blocked" text in danger, "Mark ready for review" (warning outline)

### Side Panel (overlay, 380px)

- Slides from right: `transform: translateX(100%)` → `translateX(0)`, 400ms ease-out
- Backdrop: `rgba(0,0,0,0.25)`, 400ms opacity transition, click-to-close
- Shadow: `-4px 0 24px rgba(0,0,0,0.4)`
- Header: 36px, tabs + close button, `box-shadow: 0 1px 3px rgba(0,0,0,0.2)`
- Tabs: Overview, Conversation, Commits, Checks. Active: accent underline (1.5px), 500 weight.
- Tab counts: mono 9px pills. Danger-styled for failures.

**Conversation tab:**

- "Unresolved · N" section header (warning dot, 10px uppercase)
- Unresolved items: regular convo items with small "Unresolved" pill badge (warning-muted, 9px) next to timestamp. No special card, no colored border.
- "Timeline" section header
- **Status events** (opened, approved): compact single-line, 10px, 4px padding, 6px colored dot instead of avatar, tertiary color. No body text.
- **Content events** (comments): full treatment — avatar, author, body, file:line reference (info color, clickable)
- Bot items in timeline: subtle copper tint on avatar, accent-text author name, severity badge
- "N resolved" collapsed line at bottom (ghost color, chevron, click hint)
- Comment composer: bg-raised textarea, border, "Cmd+Enter" hint

**Overview tab:**

- PR description card (bg-raised, border, radius-lg)
- Labels section (colored pills + "Add" dashed button)
- Reviewers (avatar, name, state badge: Approved green, Pending yellow, Changes red)
- AI Summary (collapsible, copper border, sparkle icon header)

**Commits tab:** SHA (accent-muted pill), message, author, time

**Checks tab:** pass/fail summary + item list with icons and durations

---

## Adaptive Behavior

| Context                                  | What Changes                                                                                           |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Solo dev (no reviewers, no conversation) | No side panel toggle. Full-width diff. Floating bar shows only merge button.                           |
| Draft PR                                 | Header muted (0.85 opacity), Draft badge, floating bar shows "Mark ready for review" instead of merge. |
| CI failing                               | Merge button disabled, "Blocked" text, CI annotations inline in diff.                                  |
| Author viewing own PR                    | No Approve/Request Changes buttons. Just merge controls.                                               |
| Large PR (>5 files)                      | Triage mode default. "N files need attention" progress.                                                |
| Small PR (≤5 files)                      | Tree mode default (simpler).                                                                           |
| Since-last-review                        | Purple callout in toolbar, diff filtered to new changes, sidebar shows "Updated since review" section. |

---

## Keyboard Shortcuts

| Key         | Action                                         |
| ----------- | ---------------------------------------------- |
| `j` / `k`   | Navigate PR list (inbox) or file list (review) |
| `Enter`     | Open selected PR / file                        |
| `/`         | Focus search                                   |
| `]` / `[`   | Next / previous file                           |
| `v`         | Toggle current file as viewed                  |
| `n`         | Jump to next file needing attention            |
| `i`         | Toggle side panel                              |
| `a`         | Approve                                        |
| `r`         | Request changes                                |
| `Cmd+Enter` | Submit review / comment                        |
| `Cmd+B`     | Toggle sidebar                                 |
| `?`         | Show shortcut help                             |

---

## Reference Files

| File                        | Purpose                                    |
| --------------------------- | ------------------------------------------ |
| `mockup-pr-review-v14.html` | Final interactive prototype (use this)     |
| `mockup-pr-review-v13.html` | Previous interactive version (pre-polish)  |
| `mockup-pr-review-v11.html` | Static scroll mockup (6 frames, v6 format) |
| `mockup-pr-review-v6.html`  | Original design language reference         |
| `DISPATCH-DESIGN-SYSTEM.md` | Color, typography, spacing tokens          |
