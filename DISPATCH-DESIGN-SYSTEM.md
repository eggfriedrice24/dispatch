# Dispatch Design System

> The CI/CD-integrated code review desktop app. Review, verify, merge, deploy — without context-switching.

This document is the authoritative design specification for Dispatch. Use it when building any UI component, page, or feature. Every color, font, spacing value, and component pattern is defined here.

---

## 1. Design Philosophy: "Warm Precision"

Dispatch's visual language is **warm, confident, and dense**. It sits between the clinical coldness of GitHub/Graphite and the maximalism of consumer apps.

### Core Principles

| Principle | What it means | What to avoid |
|-----------|--------------|---------------|
| **Warm, not cold** | Backgrounds have warm undertones. Text is off-white, not sterile. The copper accent adds life. | Cold zinc grays, sterile #fafafa whites, blue-tinted blacks |
| **Dense, not cramped** | Information-dense like a terminal, with intentional whitespace. Every pixel earns its place. | Excessive padding, card-heavy layouts, whitespace waste |
| **Editorial meets engineering** | Serif display type for personality, monospace for code, clean sans for everything between. | All-monospace UIs, all-sans UIs, generic font stacks |
| **Keyboard-first** | Every action has a keybinding. Show shortcuts inline in the UI, not hidden in docs. | Mouse-only interactions, hidden keyboard shortcuts |
| **Desktop-native** | Use native window chrome, system notifications, menu bar presence. Feel like a real app, not a website. | Browser-like UI patterns (URL bars, back buttons, tabs that look like browser tabs) |

### Comparison to Better Hub

| Dimension | Better Hub | Dispatch |
|-----------|-----------|----------|
| Background | Cold zinc `#030304` | Warm `#08080a` |
| Accent color | No hue — primary is gray `#e4e4e7` | Copper `#d4883a` |
| Text white | Sterile `#fafafa` | Warm off-white `#f0ece6` |
| Border radius | Near-zero (0.8px default) | Confident 4-8px |
| Display font | Geist Mono | Instrument Serif (italic) |
| Body font | Geist | DM Sans |
| Shadows | Near-invisible (0.18 opacity) | Present but subtle (0.3) + accent glow |
| Hero effect | WebGL halftone shader | Noise texture + copper gradient bar |

---

## 2. Color System

### 2.1 Surfaces (Dark Theme — Default)

All surface colors have a warm undertone. Never use pure neutral grays.

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-root` | `#08080a` | App background, main canvas |
| `--bg-surface` | `#0f0f12` | Navbar, sidebar, panel backgrounds |
| `--bg-raised` | `#16161b` | Cards, hover states, input backgrounds |
| `--bg-elevated` | `#1c1c22` | Dropdowns, popovers, tooltips |
| `--bg-overlay` | `rgba(0, 0, 0, 0.72)` | Modal/dialog backdrops |

### 2.2 Text

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-primary` | `#f0ece6` | Headings, primary content, important labels |
| `--text-secondary` | `#9b9590` | Body text, descriptions, secondary info |
| `--text-tertiary` | `#5e5954` | Subtle labels, timestamps, metadata |
| `--text-ghost` | `#3a3632` | Barely-visible hints, disabled states, line numbers |

### 2.3 Accent: Copper

The signature color. Used for primary actions, active states, and brand identity.

| Token | Value | Usage |
|-------|-------|-------|
| `--accent` | `#d4883a` | Primary buttons, active tab indicators, logo mark |
| `--accent-hover` | `#e09a4e` | Button hover state |
| `--accent-muted` | `rgba(212, 136, 58, 0.12)` | Active item backgrounds, badge backgrounds |
| `--accent-text` | `#e8a655` | Accent-colored text (links, labels, counts) |
| `--border-accent` | `rgba(212, 136, 58, 0.25)` | Accent-highlighted borders (AI cards, featured elements) |
| `--shadow-glow` | `0 0 20px rgba(212, 136, 58, 0.08)` | Subtle glow on primary buttons |

### 2.4 Semantic Colors

| Token | Hex | Muted (12% opacity) | Usage |
|-------|-----|---------------------|-------|
| `--success` | `#3dd68c` | `rgba(61, 214, 140, 0.10)` | CI pass, approved, merged, additions |
| `--danger` | `#ef6461` | `rgba(239, 100, 97, 0.10)` | CI fail, errors, deletions, destructive |
| `--warning` | `#f0b449` | `rgba(240, 180, 73, 0.10)` | Pending, running, draft |
| `--info` | `#5ba4e6` | `rgba(91, 164, 230, 0.10)` | Informational, file counts, hunk headers |
| `--purple` | `#a78bfa` | `rgba(167, 139, 250, 0.10)` | Review requested, approvals |

### 2.5 Borders

| Token | Hex | Usage |
|-------|-----|-------|
| `--border` | `#25231f` | Standard borders (panels, cards, inputs) |
| `--border-subtle` | `#1e1c18` | Very subtle separators (between list items) |
| `--border-strong` | `#33302a` | Emphasized borders (focused inputs, button borders) |

### 2.6 Diff Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--diff-add-bg` | `rgba(61, 214, 140, 0.07)` | Added line background |
| `--diff-add-bar` | `#3dd68c` | Addition indicator bar/marker |
| `--diff-add-word` | `rgba(61, 214, 140, 0.22)` | Word-level addition highlight |
| `--diff-del-bg` | `rgba(239, 100, 97, 0.07)` | Deleted line background |
| `--diff-del-bar` | `#ef6461` | Deletion indicator bar/marker |
| `--diff-del-word` | `rgba(239, 100, 97, 0.22)` | Word-level deletion highlight |
| `--diff-hunk-bg` | `rgba(91, 164, 230, 0.06)` | Hunk header background |

### 2.7 Scrollbar

| Token | Hex |
|-------|-----|
| `--scrollbar-thumb` | `#2a2824` |
| `--scrollbar-hover` | `#3a3632` |

Width: `5px`. Track: transparent. Thumb: `border-radius: 9999px`. Firefox: `scrollbar-width: thin`.

---

## 3. Typography

### 3.1 Font Families

| Token | Family | Fallback | Usage |
|-------|--------|----------|-------|
| `--font-sans` | **DM Sans** | `system-ui, -apple-system, sans-serif` | Body text, UI labels, buttons, all general text |
| `--font-mono` | **JetBrains Mono** | `ui-monospace, monospace` | Code, file paths, commit SHAs, counts, timestamps, keyboard shortcuts |
| `--font-display` | **Instrument Serif** | `Georgia, serif` | Display headings, landing page titles, empty states. Always italic. |

**Google Fonts import:**
```
DM Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400
JetBrains Mono:wght@400;500;600
Instrument Serif:ital@0;1
```

### 3.2 Type Scale

| Name | Family | Size | Weight | Letter-spacing | Line-height | Usage |
|------|--------|------|--------|----------------|-------------|-------|
| Display | Instrument Serif | 36-48px | 400 | -0.03em | 1.1 | Hero headings, empty states, landing |
| Page Title | DM Sans | 16-20px | 600 | -0.02em | 1.3 | PR titles, page headings |
| Section Title | DM Sans | 13px | 600 | -0.01em | 1.4 | Card headings, dialog titles |
| Body | DM Sans | 13px | 400 | normal | 1.5 | General content, descriptions |
| Small | DM Sans | 12px | 400-500 | normal | 1.4 | List items, nav tabs, button text |
| Caption | DM Sans | 11px | 400 | normal | 1.3 | Metadata, check details, tooltips |
| Label | DM Sans | 10-11px | 600 | 0.06-0.08em | 1.2 | Section headers (uppercase), sidebar labels |
| Mono | JetBrains Mono | 12-12.5px | 400 | normal | 20px | Code in diffs |
| Mono Small | JetBrains Mono | 10-11px | 400-500 | normal | 1.3 | File paths, timestamps, counts, badges |
| Mono XS | JetBrains Mono | 9-10px | 400 | normal | 1.2 | Keyboard shortcuts, tiny metadata |

### 3.3 Typography Rules

- **PR titles**: DM Sans, 16px, weight 600, letter-spacing -0.02em
- **PR numbers**: Same size as title but weight 400, color `--text-tertiary`
- **File names in diff toolbar**: JetBrains Mono, 12px, weight 500. Directory path portions use `--text-tertiary`
- **Section labels** (e.g., "Needs your review"): DM Sans, 10px, weight 600, uppercase, letter-spacing 0.06-0.08em, color `--text-tertiary`
- **Counts/badges**: JetBrains Mono, 10px, weight 500
- **Timestamps**: JetBrains Mono, 10px, color `--text-tertiary`
- **Code in diffs**: JetBrains Mono, 12.5px, line-height 20px, tab-size 4
- **Never use Inter, Roboto, Arial, or system sans-serif as the primary font**
- **Logo text**: DM Sans, 13px, weight 600, letter-spacing -0.02em

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Use a 4px base grid. Common values:

| Token | Value | Usage |
|-------|-------|-------|
| `2px` | 0.5 unit | Tight gaps (between status dot and text) |
| `4px` | 1 unit | Minimal gaps (icon groups, inline elements) |
| `6px` | 1.5 units | Button padding-y, check item padding |
| `8px` | 2 units | Standard gap (sidebar items, card padding) |
| `12px` | 3 units | Panel padding, section spacing |
| `16px` | 4 units | Section gaps, card padding |
| `20px` | 5 units | Page-level horizontal padding |
| `32-48px` | 8-12 units | Section dividers, showcase spacing |

### 4.2 Layout Structure

```
+--[ Accent Bar (2px, copper gradient) ]--+
|              Navbar (42px)              |
+------+----------------------------------+
|      |        PR Header (auto)          |
| Side |----------------------------------+
| bar  |  Diff Viewer    |  Side Panel    |
| 260px|  (flex: 1)      |  (320px)       |
|      |                 |                |
|      |                 +----------------+
|      |                 | Merge Panel    |
+------+-----------------+----------------+
```

- **Navbar height**: 42px (includes 2px accent bar at very top)
- **Sidebar width**: 260px (fixed, can be collapsible)
- **Side panel width**: 320px (resizable, collapsible)
- **Default split ratio**: ~65% diff, ~35% side panel
- **All panels separated by**: 1px solid `--border`

### 4.3 Accent Bar

A 2px bar at the very top of the app window with:
```css
background: linear-gradient(90deg, transparent, var(--accent), transparent);
opacity: 0.4;
```
This is a subtle signature detail that makes Dispatch instantly recognizable.

### 4.4 Background Texture

A subtle SVG noise texture overlay at `opacity: 0.015` across the entire app:
```css
background-image: url("data:image/svg+xml,...feTurbulence fractalNoise...");
background-repeat: repeat;
background-size: 256px;
pointer-events: none;
```
This adds a barely-perceptible grain that prevents surfaces from feeling flat/digital.

---

## 5. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | `2px` | Inline code, tiny elements |
| `--radius-sm` | `4px` | Buttons (small), nav tabs, file nav buttons, keyboard shortcuts |
| `--radius-md` | `6px` | Buttons (default), inputs, search boxes, check items, cards |
| `--radius-lg` | `8px` | Info cards, panels, dialogs |
| `--radius-xl` | `12px` | Large cards, modals |
| `--radius-full` | `9999px` | Badges, avatars, status dots, progress bars, scrollbar thumb |

Dispatch uses **more radius than Better Hub** (which defaults to near-zero) but **less than typical consumer apps**. The geometry is confident and slightly softened — not brutalist, not bubbly.

---

## 6. Shadows & Elevation

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15)` | Buttons, small elevated elements |
| `--shadow-md` | `0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2)` | Dropdowns, tooltips, popovers |
| `--shadow-lg` | `0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2)` | Modals, dialogs |
| `--shadow-glow` | `0 0 20px rgba(212,136,58,0.08)` | Primary button hover, accent-highlighted elements |

Shadows use **higher opacity than Better Hub** (0.3 vs 0.18) to be actually visible on dark backgrounds. The accent glow (`--shadow-glow`) is used sparingly on primary actions.

---

## 7. Transitions & Animation

### 7.1 Easing Curves

| Token | Value | Usage |
|-------|-------|-------|
| `--ease-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Spring-like deceleration. Tab indicators, panel resizing |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy. Badge entrance, notification dot |
| Standard `ease` | `ease` | Simple hover states |

### 7.2 Durations

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-fast` | `120ms` | Hover states, color transitions, focus rings |
| `--duration-normal` | `200ms` | Tab indicator sliding, panel transitions |
| `--duration-slow` | `400ms` | Panel collapse/expand, modal entrance |

### 7.3 Animation Rules

- **Hover states**: `transition: all var(--duration-fast) ease` — background color + text color change
- **Tab indicators**: `transition: all var(--duration-normal) var(--ease-out)` — slide left/width
- **Panel resize**: `transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1)` — only when not actively dragging
- **CI status spinner**: `animation: spin 1.5s linear infinite` on the clock icon for running checks
- **Never animate font-size, border-radius, or layout-triggering properties**
- **Prefer opacity + transform for performant animations**

---

## 8. Component Specifications

### 8.1 Navbar

- Height: `42px` (including accent bar)
- Background: `--bg-surface`
- Border: `1px solid --border` on bottom
- `-webkit-app-region: drag` on navbar (for Electron window dragging)
- `-webkit-app-region: no-drag` on interactive elements

**Logo:**
- Logo mark: 20x20px square, `--accent` background, `--radius-sm` corners, italic "d" in `--font-display` at 14px, color `--bg-root`
- Logo text: "Dispatch" in `--font-sans`, 13px, weight 600, letter-spacing -0.02em

**Nav tabs:**
- Font: 12px, weight 450, color `--text-secondary`
- Hover: color `--text-primary`, background `--bg-raised`
- Active: color `--text-primary`, weight 500
- Active indicator: 1.5px bar at `bottom: -7px`, color `--accent`, `border-radius: 1px`
- Count badges: `--font-mono` 10px, `--radius-full`, background `--accent-muted`, color `--accent-text`

**Icon buttons:**
- Size: 30x30px, icon 15x15px
- Hover: background `--bg-raised`, color `--text-primary`
- Notification dot: 6px circle, `--accent`, with 1.5px `--bg-surface` border

**Avatar:**
- Size: 24x24px, `--radius-full`
- Background: `linear-gradient(135deg, --accent, #7c5a2a)`
- Border: 1.5px solid `--border-strong`
- Initials: 10px, weight 600, color `--bg-root`

### 8.2 Buttons

**Base styles:** `inline-flex items-center justify-center gap-5px`, font 12px weight 500 `--font-sans`, `--radius-md`, cursor pointer, `transition: all --duration-fast ease`, `white-space: nowrap`

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | `--accent` | `#08080a` | `--accent` | `--accent-hover` + `--shadow-glow` |
| Secondary | `--bg-raised` | `--text-primary` | `--border-strong` | `--bg-elevated` |
| Ghost | transparent | `--text-secondary` | transparent | `--bg-raised`, text `--text-primary` |
| Success | `--success` | `#08080a` | `--success` | `brightness(1.1)` |
| Destructive | `--danger` | `#ffffff` | `--danger` | `brightness(1.1)` |

| Size | Padding | Font size |
|------|---------|-----------|
| Default | `6px 12px` | 12px |
| Small | `4px 8px` | 11px |
| Large | `8px 16px` | 13px |

Icon-only buttons: Square aspect ratio matching the height.

### 8.3 Badges

**Base:** `inline-flex items-center gap-4px`, padding `2px 8px`, font 11px weight 500, `--radius-full`. Icons inside badges: 12x12px.

| Variant | Background | Text |
|---------|-----------|------|
| Success | `--success-muted` | `--success` |
| Danger | `--danger-muted` | `--danger` |
| Warning | `--warning-muted` | `--warning` |
| Info | `--info-muted` | `--info` |
| Purple | `--purple-muted` | `--purple` |
| Neutral | `--bg-raised` + `1px --border` | `--text-secondary` |

### 8.4 Sidebar (PR Inbox)

- Width: `260px`, background `--bg-surface`, border-right `1px solid --border`
- Header padding: `12px 12px 8px`
- Title: 11px, weight 600, uppercase, letter-spacing 0.06em, color `--text-secondary`

**Search box:**
- Background `--bg-raised`, border `1px solid --border`, `--radius-md`, padding `6px 8px`
- Icon: 13x13px, color `--text-tertiary`
- Text: 12px, color `--text-tertiary`
- Keyboard hint: `--font-mono` 10px, `--bg-elevated` background, `1px --border`, `--radius-xs`

**Section labels:**
- Padding `4px 12px 6px`
- Font: 10px, weight 600, uppercase, letter-spacing 0.08em, color `--text-tertiary`
- Dot indicator: 5x5px circle, `--radius-full`, colored by section type

**PR items:**
- Padding: `8px 12px`
- Left border: `2px solid transparent` (becomes `--accent` when active)
- Hover: background `--bg-raised`
- Active: background `--accent-muted`, left border `--accent`
- Status dot: 8x8px, `--radius-full`, margin-top 4px
- Title: 12px, weight 500, `--text-primary`, single-line truncate
- Meta line: `--font-mono` 10px, `--text-tertiary`

### 8.5 PR Header

- Padding: `12px 20px`, background `--bg-surface`, border-bottom `1px solid --border`
- Title: 16px, weight 600, letter-spacing -0.02em
- PR number: same size, weight 400, color `--text-tertiary`
- Subtitle: 12px, `--text-secondary`
- Branch badges: `--font-mono` 11px, `--bg-raised` background, `1px --border`, `--radius-sm`, color `--accent-text`

### 8.6 Diff Viewer

**Toolbar:** Height 38px, padding `0 12px`, background `--bg-surface`, border-bottom `1px solid --border-subtle`

**File navigation buttons:** 24x24px, `--radius-sm`, icon 13px

**File name:** `--font-mono` 12px, weight 500. Path portions: `--text-tertiary`. Filename: `--text-primary`.

**File stats:** `--font-mono` 11px. Additions: `--success`. Deletions: `--danger`.

**Progress bar:**
- Track: 60px wide, 3px tall, `--border` background, `--radius-full`
- Fill: `--accent`, `--radius-full`, animated width transition
- Label: `--font-mono` 10px, `--text-tertiary`

**Diff lines:**
- Font: `--font-mono` 12.5px, line-height 20px, tab-size 4
- Gutter: 52px wide, two columns of 22px right-aligned numbers, font 11px `--text-ghost`
- Marker column: 16px wide, centered, font 11px weight 600
- Code column: flex 1, padding `0 12px 0 4px`, `white-space: pre`, overflow-x auto
- Hover: `filter: brightness(1.15)`
- Added lines: background `--diff-add-bg`, marker color `--success`
- Deleted lines: background `--diff-del-bg`, marker color `--danger`
- Word-level highlights: `--diff-add-word` / `--diff-del-word` with 2px radius, 1px padding

**Hunk headers:**
- Background `--diff-hunk-bg`, color `--info`, font 11px
- Padding `4px 12px`
- Borders: 1px `--border-subtle` top and bottom
- `position: sticky; top: 0; z-index: 1`

**CI annotation inline in diff:**
- Background `--danger-muted`, left border `2px solid --danger`
- Padding: `8px 12px 8px 68px` (aligned with code)
- Text: `--font-sans` 12px, color `--danger`
- Source info: `--font-mono` 10px, `--text-tertiary`
- Re-run button: ghost button with danger color

### 8.7 Side Panel

- Width: 320px (resizable), background `--bg-surface`
- Tabs: padding `10px 12px`, font 12px, weight 450
- Active tab: weight 500, color `--text-primary`, 1.5px `--accent` indicator at bottom
- Tab counts: `--font-mono` 10px, `--text-tertiary`

**Check items:**
- Padding `6px 8px`, `--radius-md`, hover background `--bg-raised`
- Icon: 16x16px container, 14x14px SVG
- Pass icon: color `--success`
- Fail icon: color `--danger`
- Running icon: color `--warning` + `animation: spin 1.5s linear infinite`
- Name: 12px, weight 450, `--text-primary`, truncate
- Detail: 10px, `--font-mono`, `--text-tertiary`

### 8.8 Merge Panel

- Padding: 12px, background `--bg-raised`, border-top `1px solid --border`
- Checklist items: 11px, icon 13x13px
- Pass items: icon `--success`, text `--text-secondary`
- Fail items: icon `--danger`, text `--danger`
- Actions: flex row with 6px gap
- Disabled merge button: `opacity: 0.5; cursor: not-allowed`

### 8.9 Info Cards

- Background `--bg-raised`, border `1px solid --border`, `--radius-lg`, padding 16px
- Title: 13px, weight 600
- Meta: 11px, `--font-mono`, `--text-tertiary`
- Body: 12px, `--text-secondary`, line-height 1.5
- Accent variant: border-color `--border-accent`

### 8.10 Tooltips / Blame Popover

- Background `--bg-elevated`, border `1px solid --border-strong`, `--radius-md`
- Padding: `8px 10px`
- Shadow: `--shadow-md`
- Author: 11px, weight 500, `--text-primary`
- Date: `--font-mono` 10px, `--text-tertiary`
- Message: 11px, `--text-secondary`, truncate at 200px

### 8.11 Toggle Groups

- Container: `--bg-raised` background, `1px --border`, `--radius-md`, padding 2px
- Options: padding `4px 10px`, font 11px, `--radius-sm`
- Inactive: color `--text-tertiary`
- Active: background `--bg-elevated`, color `--text-primary`, `--shadow-sm`

### 8.12 Keyboard Shortcut Display

- `min-width: 20px; height: 20px; padding: 0 5px`
- Font: `--font-mono` 10px, weight 500
- Background: `--bg-raised`
- Border: `1px solid --border-strong` + `box-shadow: 0 1px 0 --border`
- Radius: `--radius-sm`
- Color: `--text-secondary`

---

## 9. Icons

Use **Lucide React** icons throughout. Size conventions:

| Context | Size |
|---------|------|
| Navbar icons | 15x15px |
| Button icons | 13-14px |
| Check status icons | 14x14px |
| Badge icons | 12x12px |
| File nav arrows | 13x13px |
| Inline small | 11-12px |

All icons use `stroke="currentColor"` with `stroke-width="2"` (or `2.5` for status icons that need emphasis).

---

## 10. Patterns & Rules

### 10.1 Active/Selected States

- **Sidebar items**: Left border accent + muted accent background
- **Nav tabs**: Accent underline bar (1.5px) positioned below the tab
- **Toggle groups**: Elevated background + shadow
- **Check items**: No persistent selected state (click to expand)

### 10.2 Status Color Mapping

| Status | Color | Dot | Badge |
|--------|-------|-----|-------|
| Approved / Merged / Passing | `--success` | Green | `badge-success` |
| Failed / Error / Rejected | `--danger` | Red | `badge-danger` |
| Pending / Running / Draft | `--warning` | Amber | `badge-warning` |
| Review Requested | `--purple` | Purple | `badge-purple` |
| Informational / Neutral | `--info` | Blue | `badge-info` |

### 10.3 When to Use Each Font

| Content type | Font |
|-------------|------|
| UI labels, buttons, menu items, descriptions | `--font-sans` (DM Sans) |
| Code, file paths, branch names, commit SHAs, counts, durations, timestamps | `--font-mono` (JetBrains Mono) |
| Hero headings, empty state titles, onboarding | `--font-display` (Instrument Serif, italic) |

### 10.4 Responsive Sidebar Behavior

In the Electron app, the sidebar can be collapsed with `Cmd+B`:
- Collapsed: 0px width, content hidden
- Expanded: 260px with slide animation (400ms, `--ease-out`)
- The main content area fills available space

### 10.5 Empty States

Use `--font-display` (Instrument Serif, italic) for the main message at 24-36px. Follow with `--font-sans` 13px `--text-secondary` for a description. Use muted accent colors for optional illustrations.

---

## 11. Logo Specification

**Logo Mark:**
- 20x20px square with `--radius-sm` (4px) corners
- Background: `--accent` (`#d4883a`)
- Contains lowercase italic "d" in `--font-display` at 14px
- Text color: `--bg-root` (`#08080a`)

**Logo Text:**
- "Dispatch" in `--font-sans` (DM Sans), 13px, weight 600
- Letter-spacing: -0.02em
- Color: `--text-primary`

**Combined logo:** Mark + 7px gap + Text, vertically centered.

**Favicon:** The logo mark at 32x32px.

---

## 12. CSS Custom Properties (Complete Reference)

```css
:root {
  /* Surfaces */
  --bg-root: #08080a;
  --bg-surface: #0f0f12;
  --bg-raised: #16161b;
  --bg-elevated: #1c1c22;
  --bg-overlay: rgba(0, 0, 0, 0.72);

  /* Text */
  --text-primary: #f0ece6;
  --text-secondary: #9b9590;
  --text-tertiary: #5e5954;
  --text-ghost: #3a3632;

  /* Accent */
  --accent: #d4883a;
  --accent-hover: #e09a4e;
  --accent-muted: rgba(212, 136, 58, 0.12);
  --accent-text: #e8a655;

  /* Semantic */
  --success: #3dd68c;
  --success-muted: rgba(61, 214, 140, 0.10);
  --danger: #ef6461;
  --danger-muted: rgba(239, 100, 97, 0.10);
  --warning: #f0b449;
  --warning-muted: rgba(240, 180, 73, 0.10);
  --info: #5ba4e6;
  --info-muted: rgba(91, 164, 230, 0.10);
  --purple: #a78bfa;
  --purple-muted: rgba(167, 139, 250, 0.10);

  /* Borders */
  --border: #25231f;
  --border-subtle: #1e1c18;
  --border-strong: #33302a;
  --border-accent: rgba(212, 136, 58, 0.25);

  /* Diff */
  --diff-add-bg: rgba(61, 214, 140, 0.07);
  --diff-add-bar: #3dd68c;
  --diff-add-word: rgba(61, 214, 140, 0.22);
  --diff-del-bg: rgba(239, 100, 97, 0.07);
  --diff-del-bar: #ef6461;
  --diff-del-word: rgba(239, 100, 97, 0.22);
  --diff-hunk-bg: rgba(91, 164, 230, 0.06);

  /* Scrollbar */
  --scrollbar-thumb: #2a2824;
  --scrollbar-hover: #3a3632;

  /* Radius */
  --radius-xs: 2px;
  --radius-sm: 4px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --radius-xl: 12px;
  --radius-full: 9999px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.15);
  --shadow-md: 0 2px 8px rgba(0,0,0,0.3), 0 1px 3px rgba(0,0,0,0.2);
  --shadow-lg: 0 4px 16px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.2);
  --shadow-glow: 0 0 20px rgba(212,136,58,0.08);

  /* Typography */
  --font-sans: 'DM Sans', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-display: 'Instrument Serif', Georgia, serif;

  /* Transitions */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --duration-fast: 120ms;
  --duration-normal: 200ms;
  --duration-slow: 400ms;
}
```

---

## 13. Reference File

See `dispatch-design-reference.html` in the project root for a working visual reference showing:
- Full app mockup (navbar, sidebar inbox, PR header, diff viewer with CI annotations, checks panel, merge panel)
- Color palette swatches
- Typography scale examples
- Component showcase (buttons, badges, toggles, cards, keyboard shortcuts)
- Design comparison table vs Better Hub

Open it in any browser to see the design system in action.
