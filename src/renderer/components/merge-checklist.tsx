/**
 * Merge checklist — DISPATCH-DESIGN-SYSTEM.md § 8.8
 *
 * Shows review approval, CI checks, and merge conflict status.
 */

export function MergeChecklist({
  pr,
}: {
  pr: {
    reviewDecision: string;
    mergeable: string;
    statusCheckRollup: Array<{ conclusion: string | null }>;
  };
}) {
  const hasApproval = pr.reviewDecision === "APPROVED";
  const allChecksPassing =
    pr.statusCheckRollup.length > 0 &&
    pr.statusCheckRollup.every((c) => c.conclusion === "success");
  const noConflicts = pr.mergeable === "MERGEABLE";

  return (
    <div className="border-border bg-bg-raised border-t p-3">
      <div className="flex flex-col gap-1.5">
        <ChecklistItem
          label="Review approved"
          passed={hasApproval}
        />
        <ChecklistItem
          label={pr.statusCheckRollup.length === 0 ? "No CI checks" : "CI checks passing"}
          passed={allChecksPassing}
        />
        <ChecklistItem
          label={pr.mergeable === "CONFLICTING" ? "Merge conflicts" : "No merge conflicts"}
          passed={noConflicts}
        />
      </div>
    </div>
  );
}

function ChecklistItem({ label, passed }: { label: string; passed: boolean }) {
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
