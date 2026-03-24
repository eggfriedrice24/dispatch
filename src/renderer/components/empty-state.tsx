/**
 * Empty state — shown when no PR is selected.
 */
export function EmptyState() {
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
