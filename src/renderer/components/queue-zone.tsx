import type { GhPrListItemCore } from "@/shared/ipc";
import type { LucideIcon } from "lucide-react";

import {
  AlertCircle,
  ArrowLeft,
  Check,
  CircleDot,
  GitMerge,
  GitPullRequestClosed,
  GitPullRequestDraft,
} from "lucide-react";
import { useCallback } from "react";

/**
 * Queue zone — PR-REVIEW-REDESIGN.md § Queue zone
 *
 * Top of the review sidebar. Shows back arrow, review count,
 * and compact list of queued PRs.
 */

interface QueueZoneProps {
  queuePrs: GhPrListItemCore[];
  activePrNumber: number;
  onBack: () => void;
  onSelectPr: (prNumber: number) => void;
  hideWhenEmpty?: boolean;
}

function resolveQueueIndicator(pr: GhPrListItemCore): {
  icon: LucideIcon;
  color: string;
  label: string;
} {
  if (pr.state === "CLOSED") {
    return { icon: GitPullRequestClosed, color: "text-destructive", label: "Closed" };
  }
  if (pr.state === "MERGED") {
    return { icon: GitMerge, color: "text-purple", label: "Merged" };
  }
  if (pr.isDraft) {
    return { icon: GitPullRequestDraft, color: "text-text-ghost", label: "Draft" };
  }
  if (pr.reviewDecision === "CHANGES_REQUESTED") {
    return { icon: AlertCircle, color: "text-warning", label: "Changes requested" };
  }
  if (pr.reviewDecision === "APPROVED") {
    return { icon: Check, color: "text-success", label: "Approved" };
  }
  return { icon: CircleDot, color: "text-text-tertiary", label: "Open" };
}

export function QueueZone({ queuePrs, activePrNumber, onBack, onSelectPr }: QueueZoneProps) {
  const hasQueue = queuePrs.length > 0;

  // eslint-disable-next-line react-hooks/exhaustive-deps -- re-fire when active PR changes
  const activeRef = useCallback(
    (node: HTMLButtonElement | null) => {
      node?.scrollIntoView({ block: "nearest" });
    },
    [activePrNumber],
  );

  return (
    <div className="border-border shrink-0 border-b">
      {/* Header — always show back button */}
      <div
        className="flex items-center gap-1.5"
        style={{ padding: "5px 10px 3px" }}
      >
        <button
          type="button"
          onClick={onBack}
          className="text-text-tertiary hover:text-text-primary hover:bg-bg-raised flex cursor-pointer items-center gap-0.5 rounded-sm px-1 py-0.5 text-[11px] select-none"
        >
          <ArrowLeft size={12} />
          Queue
        </button>
        {hasQueue && (
          <>
            <span className="flex-1" />
            <span className="text-text-ghost text-[10px] font-semibold tracking-[0.06em] uppercase">
              {queuePrs.length} to review
            </span>
          </>
        )}
      </div>

      {/* Queue list — hidden when empty and hideWhenEmpty is set */}
      {hasQueue && (
        <div className="flex max-h-[120px] flex-col overflow-y-auto px-1 pb-1">
          {queuePrs.map((pr) => {
            const isActive = pr.number === activePrNumber;
            const indicator = resolveQueueIndicator(pr);
            const QueueIcon = indicator.icon;

            return (
              <button
                key={pr.number}
                ref={isActive ? activeRef : undefined}
                type="button"
                onClick={() => onSelectPr(pr.number)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-sm border-l-2 text-left text-[11px] select-none ${
                  isActive
                    ? "bg-accent-muted border-l-primary"
                    : "hover:bg-bg-raised border-l-transparent"
                }`}
                style={{ padding: "3px 8px" }}
              >
                <span title={indicator.label}>
                  <QueueIcon
                    size={10}
                    className={`shrink-0 ${indicator.color}`}
                  />
                </span>
                <span
                  className={`min-w-0 flex-1 truncate ${
                    isActive ? "text-text-primary font-medium" : "text-text-secondary font-[450]"
                  }`}
                >
                  {pr.title}
                </span>
                <span
                  className={`shrink-0 font-mono text-[10px] ${
                    isActive ? "text-accent-text" : "text-text-ghost"
                  }`}
                >
                  #{pr.number}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
