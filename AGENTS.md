# Dispatch — Agent Instructions

> CI/CD-integrated code review desktop app. Electron + Vite + Tailwind CSS.

## Required Reading

**Before writing any UI code, you MUST read `DISPATCH-DESIGN-SYSTEM.md` in the project root.** It is the authoritative specification for every color, font, spacing value, radius, shadow, animation, and component pattern used in this application. Do not improvise or use generic defaults. Every visual decision must trace back to that document.

Key things defined there that you must follow:

- **Color system**: Warm undertones only. Background is `#08080a`, not neutral gray. Accent is copper `#d4883a`, not blue.
- **Typography**: DM Sans for UI, JetBrains Mono for code/paths/timestamps, Instrument Serif (italic) for display headings. Never use Inter, Roboto, or system defaults as primary.
- **Spacing**: 4px base grid. Dense, not cramped.
- **Borders**: Warm-tinted (`#25231f`), not neutral gray.
- **Radius**: 2-12px range. Not brutalist (0px), not bubbly (16px+).
- **Shadows**: Higher opacity than typical (0.3), visible on dark backgrounds.
- **Icons**: Lucide React, specific sizes per context (see Section 9).

Also see `dispatch-design-reference.html` for a living visual reference.

---

## Tech Stack

| Layer             | Tool              | Version |
| ----------------- | ----------------- | ------- |
| Runtime           | Electron          | 41      |
| Bundler           | Vite              | 8       |
| UI Framework      | React             | 19      |
| Component Library | coss ui (Base UI) | latest  |
| Styling           | Tailwind CSS      | 4       |
| Language          | TypeScript        | 5.9     |
| Testing           | Vitest            | 4       |
| Linting           | oxlint            | latest  |
| Formatting        | oxfmt             | latest  |
| Package manager   | Bun               | latest  |

## Project Structure

```
src/
  main/            Electron main process (Node.js context)
  preload/         Preload scripts (contextBridge)
  renderer/        Vite-served renderer (browser context)
  shared/          Pure utilities shared across processes
  components/ui/   coss ui components (owned source, not node_modules)
  hooks/           Custom React hooks
  lib/             Shared utilities (cn, etc.)
```

## Commands

Use `bun run <script>` for everything.

| Script         | Command                | Purpose                                   |
| -------------- | ---------------------- | ----------------------------------------- |
| `dev`          | `bun run dev`          | Start Vite dev server + Electron with HMR |
| `build`        | `bun run build`        | Production build                          |
| `test`         | `bun run test`         | Run tests once (CI)                       |
| `test:watch`   | `bun run test:watch`   | Run tests in watch mode                   |
| `lint`         | `bun run lint`         | Lint with oxlint                          |
| `lint:fix`     | `bun run lint:fix`     | Lint and auto-fix                         |
| `format`       | `bun run format`       | Format all files with oxfmt               |
| `format:check` | `bun run format:check` | Check formatting without writing          |
| `typecheck`    | `bun run typecheck`    | TypeScript type checking                  |

## React Patterns

- **Avoid `useEffect`**. Most uses of `useEffect` can be replaced with better patterns:
  - **Derived state**: If you're syncing state in an effect (e.g. clamping an index when a list shrinks), compute it inline during render instead.
  - **Event handlers**: If an effect runs in response to a user action, move the logic into the event handler that triggered the change.
  - **Ref callbacks**: If an effect focuses/measures a DOM node on mount, use a ref callback (`ref={(node) => { ... }}`) instead.
  - **`autoFocus`**: If an effect just calls `.focus()` on mount, use the `autoFocus` HTML attribute.
  - **Render-time notifications**: If an effect notifies a parent of derived state changes, use a ref to track the previous value and call the callback conditionally during render.
- Legitimate uses of `useEffect` that should stay: subscribing to external events (IPC, DOM listeners), timers/intervals, async initialization, and scroll-into-view triggered by state changes.
- Prefer `useMemo` for expensive derived values and `useCallback` for stable function references passed as props.

## Code Standards

- **Formatting**: oxfmt handles all formatting. Do not manually adjust whitespace, quotes, semicolons, or trailing commas. Run `bun run format` after writing code.
- **Linting**: oxlint with TypeScript, import, unicorn, and vitest plugins. Zero warnings policy — if oxlint warns, fix it.
- **Imports**: oxfmt auto-sorts imports. Type imports go first, then builtins, then externals, then internal, then relative.
- **Types**: Use `type` keyword for type-only imports. Strict mode is on. No `any` unless unavoidable (and explain why).
- **Testing**: Co-locate test files next to source (`foo.ts` → `foo.test.ts`). Use `describe`/`it`/`expect` from `vitest`.
- **File naming**: `kebab-case` for all files (enforced by oxlint).
- **Semicolons**: Yes. Double quotes. Trailing commas everywhere.

## Electron Architecture

- **Main process** (`src/main/`): Node.js context. Has full OS access. Communicates with renderer via IPC.
- **Preload** (`src/preload/`): Bridge between main and renderer. Exposes a typed `window.api` object via `contextBridge`. Keep this surface minimal.
- **Renderer** (`src/renderer/`): Browser context. No direct Node.js access. Uses `window.api` for IPC. All UI lives here.
- **Context isolation**: Enabled. **Node integration**: Disabled. **Sandbox**: Enabled. Do not weaken these.

## Package Manager

Use **Bun** exclusively:

- `bun install` — not npm/yarn/pnpm
- `bun add <pkg>` / `bun add -d <pkg>` — add dependencies
- `bun run <script>` — run package.json scripts
- `bunx <pkg>` — instead of npx
