# Phase 4: Distribution, Polish & Go-to-Market

## Context

Phases 1-3 built the product. Phase 4 makes it shippable.

At this point Dispatch has: PR review with syntax highlighting, blame, inline comments, CI annotations, checks panel with logs, approve/merge flow, review rounds, workflows dashboard with Gantt timelines and run comparison, team metrics, releases with changelog generation, AI-powered explanations and summaries, multi-repo inbox, desktop notifications with in-app center, and a settings panel.

The app works. Now it needs to be installable, updatable, discoverable, and monetizable.

---

## Part A: Distribution & Auto-Update

### A1. Code Signing

Unsigned Electron apps trigger Gatekeeper warnings on macOS ("app is from an unidentified developer") and SmartScreen on Windows. This kills adoption.

**macOS:**

1. Enroll in the Apple Developer Program ($99/year) → get a Developer ID certificate
2. Sign the app with `electron-builder`'s built-in signing:
   ```json
   "mac": {
     "identity": "Developer ID Application: Your Name (TEAM_ID)",
     "hardenedRuntime": true,
     "gatekeeperAssess": false,
     "entitlements": "build/entitlements.mac.plist",
     "entitlementsInherit": "build/entitlements.mac.plist"
   }
   ```
3. Notarize with Apple — `electron-builder` supports `@electron/notarize`:
   ```json
   "afterSign": "scripts/notarize.js"
   ```
4. Create `build/entitlements.mac.plist` — needs at minimum:
   - `com.apple.security.cs.allow-jit` (for Shiki WASM)
   - `com.apple.security.cs.allow-unsigned-executable-memory` (for Shiki WASM)
   - `com.apple.security.network.client` (for AI API calls)

**New file:** `build/entitlements.mac.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.network.client</key>
  <true/>
</dict>
</plist>
```

**New file:** `scripts/notarize.js`

```javascript
const { notarize } = require("@electron/notarize");

exports.default = async function notarizing(context) {
  if (context.electronPlatformName !== "darwin") return;
  await notarize({
    appBundleId: "dev.dispatch.app",
    appPath: context.appOutDir + "/" + context.packager.appInfo.productFilename + ".app",
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID,
  });
};
```

**Windows:**

1. Get an EV code signing certificate (DigiCert, Sectigo, etc.) — $200-500/year
2. Configure in `electron-builder`:
   ```json
   "win": {
     "signingHashAlgorithms": ["sha256"],
     "certificateFile": "path/to/cert.pfx",
     "certificatePassword": "${env.WIN_CERT_PASSWORD}"
   }
   ```

### A2. Auto-Update

Users should never manually download updates. The app should silently update in the background.

**Install:**

```bash
bun add electron-updater
```

**Backend:** Host releases on GitHub Releases (free, already integrated with `gh`). `electron-updater` supports GitHub Releases as an update source natively.

**Modify:** `src/main/index.ts`

```typescript
import { autoUpdater } from "electron-updater";

// After window creation:
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

autoUpdater.on("update-available", (info) => {
  // Optionally notify renderer
  mainWindow?.webContents.send("update-available", info.version);
});

autoUpdater.on("update-downloaded", (info) => {
  // Show a non-intrusive notification
  mainWindow?.webContents.send("update-downloaded", info.version);
});

// Check for updates on launch, then every 4 hours
autoUpdater.checkForUpdates();
setInterval(() => autoUpdater.checkForUpdates(), 4 * 60 * 60 * 1000);
```

**UI component:** `src/renderer/components/update-banner.tsx`

A subtle banner at the top of the app when an update is downloaded:

```
Update v0.2.0 ready — restart to apply  [Restart now]  [Later]
```

- Background: `var(--accent-muted)`
- Text: `var(--accent-text)`, 12px
- "Restart now" button: ghost variant, accent color
- Dismissible with "Later" (hides until next launch)
- Height: 32px, slides down from the accent bar

**Modify:** `package.json` build config:

```json
"publish": {
  "provider": "github",
  "owner": "dispatchdev",
  "repo": "dispatch"
}
```

### A3. CI/CD Pipeline for Releases

**New file:** `.github/workflows/release.yml`

Triggered on push to a tag matching `v*`:

```yaml
name: Release
on:
  push:
    tags: ["v*"]

jobs:
  build-mac:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - name: Build & sign macOS app
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.MAC_CERT_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
        run: npx electron-builder --mac --publish always

  build-windows:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - name: Build & sign Windows app
        env:
          WIN_CSC_LINK: ${{ secrets.WIN_CERT_BASE64 }}
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERT_PASSWORD }}
        run: npx electron-builder --win --publish always

  build-linux:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - run: npx electron-builder --linux --publish always
```

This creates a GitHub Release with DMG (macOS), NSIS installer (Windows), and AppImage/deb (Linux) on every version tag.

### A4. Homebrew Cask (macOS)

Most developers install desktop apps via `brew install --cask`. Create a Homebrew tap.

**New repo:** `dispatchdev/homebrew-tap`

**File:** `Casks/dispatch.rb`

```ruby
cask "dispatch" do
  version "0.1.0"
  sha256 "COMPUTED_SHA256"

  url "https://github.com/dispatchdev/dispatch/releases/download/v#{version}/Dispatch-#{version}-arm64.dmg"
  name "Dispatch"
  desc "CI/CD-integrated code review desktop app"
  homepage "https://dispatch.dev"

  livecheck do
    url :url
    strategy :github_latest
  end

  app "Dispatch.app"

  zap trash: [
    "~/Library/Application Support/Dispatch",
    "~/Library/Preferences/dev.dispatch.app.plist",
  ]
end
```

Installation: `brew install dispatchdev/tap/dispatch`

---

## Part B: Browser Extension

A Chrome/Firefox extension that intercepts GitHub PR URLs and opens them in Dispatch.

### B1. Extension Architecture

When a user navigates to `github.com/{owner}/{repo}/pull/{number}`, the extension:

1. Shows a small "Open in Dispatch" button overlaid on the GitHub PR page
2. On click, opens a `dispatch://` deep link that Dispatch handles

### B2. Deep Link Protocol

**Modify:** `src/main/index.ts`

Register Dispatch as a handler for the `dispatch://` protocol:

```typescript
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("dispatch", process.execPath, [resolve(process.argv[1])]);
  }
} else {
  app.setAsDefaultProtocolClient("dispatch");
}

// Handle the protocol URL
app.on("open-url", (_event, url) => {
  // url format: dispatch://review/{owner}/{repo}/{number}
  const match = url.match(/dispatch:\/\/review\/([^/]+)\/([^/]+)\/(\d+)/);
  if (match) {
    const [, owner, repo, number] = match;
    // Send to renderer to navigate
    mainWindow?.webContents.send("deep-link", { owner, repo, prNumber: Number(number) });
  }
});
```

**Modify:** Renderer to listen for deep-link events and navigate to the correct PR.

### B3. Chrome Extension

**New repo:** `dispatchdev/dispatch-extension`

Minimal manifest v3 extension:

```json
{
  "manifest_version": 3,
  "name": "Open in Dispatch",
  "version": "0.1.0",
  "description": "Open GitHub pull requests in Dispatch",
  "permissions": ["activeTab"],
  "content_scripts": [
    {
      "matches": ["https://github.com/*/*/pull/*"],
      "js": ["content.js"],
      "css": ["content.css"]
    }
  ],
  "icons": {
    "16": "icon-16.png",
    "48": "icon-48.png",
    "128": "icon-128.png"
  }
}
```

**`content.js`:**

```javascript
// Inject "Open in Dispatch" button next to the PR title
const prMatch = window.location.pathname.match(/^\/([^/]+)\/([^/]+)\/pull\/(\d+)/);
if (prMatch) {
  const [, owner, repo, number] = prMatch;
  const btn = document.createElement("a");
  btn.href = `dispatch://review/${owner}/${repo}/${number}`;
  btn.textContent = "Open in Dispatch";
  btn.className = "dispatch-btn";
  // Insert next to the PR title header
  const header = document.querySelector(".gh-header-title");
  if (header) header.appendChild(btn);
}
```

**`content.css`:**

```css
.dispatch-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: 8px;
  padding: 2px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #d4883a;
  border: 1px solid #d4883a33;
  border-radius: 6px;
  text-decoration: none;
  vertical-align: middle;
}
.dispatch-btn:hover {
  background: #d4883a15;
}
```

Use the existing icon PNGs from `resources/` for the extension icons.

---

## Part C: Website & Landing Page

### C1. Domain & Hosting

- Domain: `dispatch.dev` (or `getdispatch.dev` / `dispatchdev.com` if unavailable)
- Hosting: Vercel or Cloudflare Pages (static site, free tier)
- Framework: Plain HTML/CSS or Astro (minimal, fast)

### C2. Landing Page Content

Single-page site. No blog, no docs site (yet). Just the pitch:

**Hero section:**

- Display heading (Instrument Serif italic): "Review. Verify. Ship."
- Subheading: "The CI/CD-integrated code review app for GitHub. Desktop-native. Keyboard-first. AI-augmented."
- CTA button: "Download for macOS" (copper, large) + secondary "Windows" / "Linux" links
- Hero screenshot: The PR detail view showing the diff with CI annotation and blame popover

**Feature sections (3-4):**

1. "CI failures at the exact line" — screenshot of CI annotation inline in diff
2. "Blame without leaving the review" — screenshot of blame popover
3. "Workflows at a glance" — screenshot of Gantt timeline
4. "AI that augments, not replaces" — screenshot of AI explanation inline

**Social proof (when available):**

- GitHub stars count
- "Used by engineers at..." logos
- Testimonial quotes

**Footer:**

- Links: GitHub, Twitter/X, Discord, Changelog
- "Built by [your name/team]"
- "Dispatch is open source" (if applicable) or pricing link

**Design:** Use the Dispatch design system — dark background (`#08080a`), copper accent, DM Sans + Instrument Serif, noise texture. The website should feel like the app.

### C3. Changelog

**New file in website repo:** `changelog.md` or `/changelog` page

Each release gets an entry with:

- Version number and date
- 3-5 bullet points of what changed
- Screenshot if the change is visual

This is essential for early adopters who want to know the app is actively developed.

---

## Part D: Analytics & Crash Reporting

### D1. Crash Reporting (Sentry)

**Install:**

```bash
bun add @sentry/electron
```

**Modify:** `src/main/index.ts`

```typescript
import * as Sentry from "@sentry/electron/main";
Sentry.init({ dsn: "https://xxx@sentry.io/xxx" });
```

**Modify:** `src/renderer/main.tsx`

```typescript
import * as Sentry from "@sentry/electron/renderer";
Sentry.init({});
```

This captures unhandled exceptions and promise rejections in both main and renderer processes. Essential for fixing bugs you can't reproduce locally.

**Privacy:** Sentry receives stack traces and error messages. No code, no PR content, no GitHub data. Add a note in the settings view: "Dispatch sends anonymous crash reports to help us fix bugs. No code or personal data is included."

### D2. Anonymous Usage Analytics (Opt-in)

Lightweight, privacy-respecting analytics to understand which features are used.

**Do NOT use:** Google Analytics, Mixpanel, Amplitude (too invasive, enterprise teams will reject).

**Options:**

- **Plausible** (self-hosted or cloud, privacy-first, no cookies) — for the website
- **PostHog** (self-hosted option, feature flags, product analytics) — for the app
- **Roll your own** — a single `fetch()` to a Cloudflare Worker that increments counters. No user identification. Just: "app opened", "PR reviewed", "merge clicked", "AI explanation used". Aggregate counts only.

For v1, roll your own with a Cloudflare Worker. Keep it dead simple:

```typescript
// In renderer, on significant actions:
function trackEvent(event: string): void {
  if (!analyticsOptedIn) return;
  fetch("https://telemetry.dispatch.dev/event", {
    method: "POST",
    body: JSON.stringify({ event, version: APP_VERSION }),
  }).catch(() => {}); // Fire-and-forget
}
```

**Settings toggle:** "Send anonymous usage data to help improve Dispatch" — default OFF. Respect the choice.

---

## Part E: Licensing & Monetization (If Going Commercial)

### E1. Pricing Model

Based on competitive analysis:

| Tier     | Price          | What you get                                                                                 |
| -------- | -------------- | -------------------------------------------------------------------------------------------- |
| **Free** | $0             | Full PR review experience (Phase 1). Single repo. No AI.                                     |
| **Pro**  | $12/user/month | Multi-repo inbox, AI features, team metrics, workflows dashboard, releases. Unlimited repos. |
| **Team** | $20/user/month | Everything in Pro + priority support + future enterprise features (SSO, audit logs).         |

Compare: Graphite charges $40/user/month. We undercut significantly because we have no server costs.

### E2. License Key System

**Simple approach:** Use a license key that unlocks Pro/Team features.

**New IPC endpoint:** `license.validate`

```typescript
"license.validate": {
  args: { key: string };
  result: {
    valid: boolean;
    tier: "free" | "pro" | "team";
    expiresAt: string;
    seats: number;
  };
};
```

**Implementation:** The license key is a signed JWT (or a simple encrypted token) that encodes the tier, expiry, and seat count. Validate it against a simple API endpoint on your website.

**Backend:** A minimal API (Cloudflare Worker or Vercel Edge Function) that:

- Issues license keys after Stripe payment
- Validates keys (checks expiry, seat count)
- Returns tier info

**Gating in the app:**

- Store the license key + validation result in SQLite preferences
- Check on app start + every 24 hours
- For free tier: Hide AI features, disable multi-repo, hide metrics/releases
- Show a subtle upgrade prompt in the settings view: "Upgrade to Pro for multi-repo, AI, and team metrics"
- Never nag. Never block core functionality. The free tier should be genuinely useful.

### E3. Stripe Integration

Use Stripe Checkout for payments. No payment UI in the app — redirect to a Stripe-hosted checkout page on the website.

Flow:

1. User clicks "Upgrade" in settings
2. Opens `https://dispatch.dev/pricing` in their browser
3. They complete Stripe Checkout
4. Webhook to your API generates a license key
5. User copies the key back into Dispatch settings
6. App validates and unlocks Pro features

This is intentionally low-tech. No in-app payment UI, no Electron payment flow complexity. Just a key.

---

## Part F: Testing & Quality

### F1. Component Tests

**Install:**

```bash
bun add -d @testing-library/react @testing-library/jest-dom jsdom
```

**Priority test targets:**

| Component              | What to test                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------- |
| `diff-parser.ts`       | Already has 431 lines of tests. Maintain.                                                         |
| `diff-viewer.tsx`      | Renders correct line counts, handles empty files, word-diff highlighting, hunk headers            |
| `pr-inbox.tsx`         | Renders PR items from mock data, search filtering works, keyboard navigation                      |
| `checks-panel.tsx`     | Status icon mapping, re-run button calls correct IPC                                              |
| `merge flow`           | Button disabled when checks failing, enabled when conditions met, calls correct IPC with strategy |
| `notification polling` | Detects new PRs, CI failures, approvals correctly                                                 |
| `router.tsx`           | Navigates between views, preserves state                                                          |

### F2. E2E Tests (Stretch)

Use Playwright with `electron` support. Test the full flow:

1. App launches → splash → onboarding (mock workspace)
2. Navigate to PR list → select PR → view diff
3. Approve PR → merge → toast appears

This is a stretch goal. Prioritize component tests first.

### F3. Performance Benchmarks

Create a benchmark script that:

1. Generates a synthetic diff with 10,000 lines
2. Renders it in the diff viewer
3. Measures: time to first paint, scroll FPS, memory usage

Run this in CI to catch performance regressions. Especially important once virtualization is implemented.

---

## Part G: Documentation

### G1. README.md

The repo needs a proper README:

```markdown
# Dispatch

The CI/CD-integrated code review app for GitHub.

[Screenshot]

## Features

- PR inbox with real-time polling across multiple repos
- Virtualized diff viewer with syntax highlighting and blame-on-hover
- CI annotations inline at the exact line that failed
- Workflows dashboard with Gantt timelines and run comparison
- AI-powered code explanations and review summaries
- Team metrics, releases, desktop notifications

## Install

### macOS
```

brew install dispatchdev/tap/dispatch

```

### Download
[Download for macOS](link) · [Windows](link) · [Linux](link)

## Development
```

bun install
bun dev

```

## Architecture
See [MISSION.md](MISSION.md) for the full technical vision.
```

### G2. CONTRIBUTING.md

If open-sourcing:

- How to set up the dev environment
- How to run tests
- Code style (oxlint + oxfmt)
- PR process

### G3. In-App Help (Keyboard Shortcut Sheet)

**New component:** `src/renderer/components/keyboard-shortcuts-dialog.tsx`

Triggered by `?` key (standard in keyboard-driven apps). Shows a modal/dialog with all available shortcuts:

```
Navigation
  j / k          Previous / next PR
  Enter          Open selected PR
  [ / ]          Previous / next file
  Cmd+B          Toggle sidebar

Actions
  a              Approve PR
  m              Merge PR
  v              Toggle file viewed
  n              Next unreviewed file
  c              Comment on line

Search
  /              Focus search
  Cmd+F          Search in diff
  Escape         Clear / close
```

Styled per design system: `bg-bg-elevated`, `border-border-strong`, monospace keys in `<kbd>` elements, sections with uppercase labels.

---

## New Files Summary

| Action | File                                                    | Description                                                  |
| ------ | ------------------------------------------------------- | ------------------------------------------------------------ |
| Create | `build/entitlements.mac.plist`                          | macOS entitlements for code signing                          |
| Create | `scripts/notarize.js`                                   | Apple notarization after-sign script                         |
| Create | `.github/workflows/release.yml`                         | CI pipeline for building + publishing releases               |
| Create | `src/renderer/components/update-banner.tsx`             | "Update available" non-intrusive banner                      |
| Create | `src/renderer/components/keyboard-shortcuts-dialog.tsx` | `?` key shortcut reference sheet                             |
| Modify | `src/main/index.ts`                                     | Auto-updater, deep link protocol handler                     |
| Modify | `package.json`                                          | Add `publish` config, `electron-updater` dep, signing config |

## Dependencies to Install

```bash
bun add electron-updater
bun add -d @electron/notarize @testing-library/react @testing-library/jest-dom jsdom
```

---

## Priority Order

If you can only do some of this:

1. **Code signing + notarization** (can't distribute without it)
2. **Auto-update** (users won't manually re-download)
3. **Release CI pipeline** (automates 1 + 2)
4. **Landing page** (people need to find and download the app)
5. **Homebrew cask** (developer distribution channel)
6. **Browser extension** (drives adoption from GitHub)
7. **Crash reporting** (find bugs in the wild)
8. **Keyboard shortcuts dialog** (quick win, high polish)
9. **Component tests** (safety net for ongoing development)
10. **Licensing** (only when you have users to charge)
