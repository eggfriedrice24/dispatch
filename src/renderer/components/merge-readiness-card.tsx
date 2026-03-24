/**
 * Merge readiness card — PR-REVIEW-REDESIGN.md § Merge readiness card
 *
 * Bottom of review sidebar. Shows title, dot progress + checklist items.
 */

interface MergeReadinessCardProps {
  hasApproval: boolean;
  allChecksPassing: boolean;
  noConflicts: boolean;
  hasChecks: boolean;
}

export function MergeReadinessCard({
  hasApproval,
  allChecksPassing,
  noConflicts,
  hasChecks,
}: MergeReadinessCardProps) {
  const items = [
    { label: hasChecks ? "CI passed" : "No CI checks", met: allChecksPassing || !hasChecks },
    { label: hasApproval ? "1 approval" : "Approval needed", met: hasApproval },
    { label: noConflicts ? "No conflicts" : "Conflicts", met: noConflicts },
  ];

  return (
    <div
      className="bg-bg-raised shrink-0 rounded-lg"
      style={{ margin: "6px", padding: "8px 10px", borderTop: "1px solid var(--border)" }}
    >
      {/* Title */}
      <div className="text-text-tertiary mb-1 text-[10px] font-semibold tracking-[0.06em] uppercase">
        Merge readiness
      </div>

      {/* Dot progress */}
      <div className="mb-[5px] flex items-center gap-1">
        {items.map((item, i) => (
          <span
            key={i}
            className="rounded-full"
            style={{
              width: "6px",
              height: "6px",
              background: item.met ? "var(--success)" : "var(--warning)",
            }}
          />
        ))}
      </div>

      {/* Checklist */}
      <div
        className="flex flex-col"
        style={{ gap: "1px" }}
      >
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-1 text-[10px]"
            style={{ padding: "1px 0" }}
          >
            <span
              className="shrink-0 text-[10px]"
              style={{ color: item.met ? "var(--success)" : "var(--warning)" }}
            >
              {item.met ? "✓" : "●"}
            </span>
            <span
              style={{
                color: item.met ? "var(--text-tertiary)" : "var(--text-secondary)",
              }}
            >
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
