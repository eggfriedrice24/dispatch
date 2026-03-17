import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, GitMerge } from "lucide-react";

/**
 * PR detail view matching DISPATCH-DESIGN-SYSTEM.md § 8.5, 8.6:
 *
 * - PR Header: padding 12px 20px, bg --bg-surface, border-bottom --border
 * - Diff viewer toolbar: height 38px, padding 0 12px
 */

interface PrDetailViewProps {
  prNumber: number | null;
}

export function PrDetailView({ prNumber }: PrDetailViewProps) {
  if (!prNumber) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* PR Header (§ 8.5) */}
      <PrHeader prNumber={prNumber} />

      {/* Diff viewer area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Diff content */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <DiffToolbar />
          <DiffPlaceholder />
        </div>

        {/* Side panel (§ 8.7) — 320px */}
        <SidePanel />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state (§ 10.5)
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3">
      <h2 className="font-heading text-text-primary text-3xl italic">Select a pull request</h2>
      <p className="text-text-secondary max-w-xs text-center text-[13px]">
        Choose a PR from the sidebar to start reviewing. Use{" "}
        <kbd className="border-border-strong bg-bg-raised text-text-secondary rounded-xs border px-1 py-0.5 font-mono text-[10px] font-medium shadow-[0_1px_0_var(--border)]">
          j
        </kbd>
        /
        <kbd className="border-border-strong bg-bg-raised text-text-secondary rounded-xs border px-1 py-0.5 font-mono text-[10px] font-medium shadow-[0_1px_0_var(--border)]">
          k
        </kbd>{" "}
        to navigate.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PR Header (§ 8.5)
// ---------------------------------------------------------------------------

function PrHeader({ prNumber }: { prNumber: number }) {
  return (
    <div className="border-border bg-bg-surface flex items-center gap-3 border-b px-5 py-3">
      <div className="min-w-0 flex-1">
        <h1 className="text-text-primary text-base font-semibold tracking-[-0.02em]">
          Add CI/CD pipeline integration{" "}
          <span className="text-text-tertiary font-normal">#{prNumber}</span>
        </h1>
        <p className="text-text-secondary mt-0.5 text-xs">
          <Badge
            variant="outline"
            className="border-border bg-bg-raised text-accent-text mr-1.5 rounded-sm font-mono text-[11px]"
          >
            feature/ci-cd
          </Badge>
          → main · opened 2 hours ago by alice
        </p>
      </div>
      <Button
        size="sm"
        variant="default"
        className="bg-primary text-primary-foreground hover:bg-accent-hover gap-1.5"
      >
        <GitMerge size={13} />
        Merge
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff toolbar (§ 8.6 Toolbar)
// ---------------------------------------------------------------------------

function DiffToolbar() {
  return (
    <div className="border-border-subtle bg-bg-surface flex h-[38px] shrink-0 items-center gap-2 border-b px-3">
      {/* File navigation arrows (§ 8.6) */}
      <button
        type="button"
        className="text-text-secondary hover:bg-bg-raised hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-sm"
      >
        <ChevronLeft size={13} />
      </button>
      <button
        type="button"
        className="text-text-secondary hover:bg-bg-raised hover:text-text-primary flex h-6 w-6 items-center justify-center rounded-sm"
      >
        <ChevronRight size={13} />
      </button>

      {/* File name (§ 8.6) */}
      <span className="text-text-tertiary font-mono text-xs">
        src/main/<span className="text-text-primary font-medium">index.ts</span>
      </span>

      <div className="flex-1" />

      {/* File stats */}
      <span className="text-success font-mono text-[11px]">+42</span>
      <span className="text-destructive font-mono text-[11px]">-12</span>

      {/* Progress bar (§ 8.6 Progress bar) */}
      <div className="flex items-center gap-1.5">
        <div className="bg-border h-[3px] w-[60px] overflow-hidden rounded-full">
          <div className="bg-primary h-full w-1/4 rounded-full" />
        </div>
        <span className="text-text-tertiary font-mono text-[10px]">1/4</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diff placeholder
// ---------------------------------------------------------------------------

function DiffPlaceholder() {
  return (
    <div className="bg-bg-root flex-1 overflow-auto p-4">
      <div className="border-border bg-bg-surface rounded-lg border p-4">
        <p className="text-text-tertiary font-mono text-xs">
          Diff viewer will be rendered here with virtualized lines.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Side panel (§ 8.7)
// ---------------------------------------------------------------------------

function SidePanel() {
  return (
    <aside className="border-border bg-bg-surface flex w-[320px] shrink-0 flex-col border-l">
      {/* Tabs (§ 8.7) */}
      <div className="border-border flex border-b px-3 pt-2.5">
        <SidePanelTab
          label="Checks"
          count={4}
          active
        />
        <SidePanelTab
          label="Reviews"
          count={2}
        />
        <SidePanelTab
          label="Files"
          count={12}
        />
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto p-3">
        <CheckItem
          name="Build"
          status="success"
          detail="Completed in 2m 34s"
        />
        <CheckItem
          name="Lint"
          status="success"
          detail="Completed in 45s"
        />
        <CheckItem
          name="Test"
          status="failure"
          detail="3 tests failed"
        />
        <CheckItem
          name="Deploy Preview"
          status="pending"
          detail="Running..."
        />
      </div>

      {/* Merge panel (§ 8.8) */}
      <MergePanel />
    </aside>
  );
}

function SidePanelTab({
  label,
  count,
  active = false,
}: {
  label: string;
  count: number;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      className={`relative px-3 pb-2.5 text-xs ${
        active
          ? "text-text-primary font-medium"
          : "text-text-secondary hover:text-text-primary font-[450]"
      }`}
    >
      {label}
      <span className="text-text-tertiary ml-1 font-mono text-[10px]">{count}</span>
      {active && (
        <div className="bg-primary absolute bottom-0 left-1/2 h-[1.5px] w-4 -translate-x-1/2 rounded-[1px]" />
      )}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Check items (§ 8.7 Check items)
// ---------------------------------------------------------------------------

const CHECK_ICONS: Record<string, { color: string; icon: string }> = {
  success: { color: "text-success", icon: "✓" },
  failure: { color: "text-destructive", icon: "✕" },
  pending: { color: "text-warning", icon: "◎" },
};

function CheckItem({ name, status, detail }: { name: string; status: string; detail: string }) {
  const { color, icon } = CHECK_ICONS[status] ?? { color: "text-text-ghost", icon: "?" };

  return (
    <div className="hover:bg-bg-raised flex items-center gap-2 rounded-md px-2 py-1.5">
      <span className={`flex h-4 w-4 items-center justify-center text-sm ${color}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-text-primary truncate text-xs font-[450]">{name}</p>
        <p className="text-text-tertiary font-mono text-[10px]">{detail}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Merge panel (§ 8.8)
// ---------------------------------------------------------------------------

function MergePanel() {
  return (
    <div className="border-border bg-bg-raised border-t p-3">
      <div className="flex flex-col gap-1.5">
        <MergeChecklistItem
          label="CI checks passing"
          passed={false}
        />
        <MergeChecklistItem
          label="Review approved"
          passed
        />
        <MergeChecklistItem
          label="No merge conflicts"
          passed
        />
      </div>
      <div className="mt-3 flex gap-1.5">
        <Button
          size="sm"
          className="bg-primary text-primary-foreground flex-1 gap-1.5 opacity-50"
          disabled
        >
          <GitMerge size={13} />
          Merge
        </Button>
      </div>
    </div>
  );
}

function MergeChecklistItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`flex h-[13px] w-[13px] items-center justify-center text-[10px] ${
          passed ? "text-success" : "text-destructive"
        }`}
      >
        {passed ? "✓" : "✕"}
      </span>
      <span className={`text-[11px] ${passed ? "text-text-secondary" : "text-destructive"}`}>
        {label}
      </span>
    </div>
  );
}
