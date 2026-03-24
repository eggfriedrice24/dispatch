import type { GhPrDetail } from "@/shared/ipc";

import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { Check, Eye, GitMerge, MessageSquare } from "lucide-react";

import { ipc } from "../lib/ipc";
import { queryClient } from "../lib/query-client";

/**
 * Floating review bar — mockup-pr-review-v14.html § .review-bar
 *
 * Frosted glass bar at bottom-center. Stats → pending pill → sep → action buttons.
 */

interface FloatingReviewBarProps {
  viewedCount: number;
  totalFiles: number;
  commentCount: number;
  checkSummary: Array<{ name: string; status: string; conclusion: string | null }>;
  isAuthor: boolean;
  isDraft: boolean;
  pr: GhPrDetail;
  cwd: string;
  prNumber: number;
  canAdmin: boolean;
  currentUserReview: string | null;
}

export function FloatingReviewBar({
  viewedCount,
  totalFiles,
  commentCount,
  checkSummary,
  isAuthor,
  isDraft,
  pr,
  cwd,
  prNumber,
  canAdmin,
  currentUserReview,
}: FloatingReviewBarProps) {
  const passCount = checkSummary.filter((c) => c.conclusion === "success").length;
  const failCount = checkSummary.filter((c) => c.conclusion === "failure").length;
  const allPassing = checkSummary.length > 0 && failCount === 0;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "12px",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 20,
        background: "rgba(28,28,34,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-xl)",
        padding: "5px 5px 5px 12px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        boxShadow: "var(--shadow-lg), var(--shadow-glow)",
      }}
    >
      {/* Stats */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "11px",
          color: "var(--text-secondary)",
          whiteSpace: "nowrap",
        }}
      >
        {/* Viewed */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ color: "var(--text-tertiary)" }}>
            <Eye size={11} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-primary)",
            }}
          >
            {viewedCount}/{totalFiles}
          </span>
        </div>

        {/* Comments */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ color: "var(--text-tertiary)" }}>
            <MessageSquare size={11} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: "var(--text-primary)",
            }}
          >
            {commentCount}
          </span>
        </div>

        {/* Checks */}
        <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
          <span style={{ color: "var(--text-tertiary)" }}>
            <Check size={11} />
          </span>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              color: allPassing
                ? "var(--success)"
                : failCount > 0
                  ? "var(--danger)"
                  : "var(--text-primary)",
            }}
          >
            {failCount > 0
              ? `${failCount} failed`
              : checkSummary.length > 0
                ? `${passCount}/${checkSummary.length}`
                : "—"}
          </span>
        </div>
      </div>

      {/* Pending pill */}
      <span
        style={{
          fontSize: "10px",
          fontWeight: 500,
          padding: "1px 7px",
          borderRadius: "var(--radius-full)",
          background: "var(--accent-muted)",
          color: "var(--accent-text)",
          fontFamily: "var(--font-mono)",
        }}
      >
        3 pending
      </span>

      {/* Separator */}
      <div
        style={{
          width: "1px",
          height: "18px",
          background: "var(--border)",
          flexShrink: 0,
        }}
      />

      {/* Action buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "3px" }}>
        {!isAuthor && (
          <>
            <RequestChangesBarButton
              cwd={cwd}
              prNumber={prNumber}
            />
            <ApproveBarButton
              cwd={cwd}
              prNumber={prNumber}
              currentUserReview={currentUserReview}
            />
          </>
        )}
        <MergeBarButton
          cwd={cwd}
          prNumber={prNumber}
          pr={pr}
          canAdmin={canAdmin}
          isDraft={isDraft}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Buttons — matching mockup .btn .btn-outline / .btn-success / .btn-primary
// ---------------------------------------------------------------------------

const btnBase: React.CSSProperties = {
  padding: "5px 10px",
  borderRadius: "var(--radius-md)",
  fontSize: "11px",
  fontWeight: 500,
  fontFamily: "var(--font-sans)",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  border: "1px solid transparent",
  whiteSpace: "nowrap",
  userSelect: "none",
};

function RequestChangesBarButton({ cwd, prNumber }: { cwd: string; prNumber: number }) {
  const reviewMutation = useMutation({
    mutationFn: () =>
      ipc("pr.submitReview", { cwd, prNumber, event: "REQUEST_CHANGES" as const, body: "" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr"] });
      toastManager.add({ title: "Changes requested", type: "success" });
    },
    onError: (err) => {
      toastManager.add({ title: "Review failed", description: String(err.message), type: "error" });
    },
  });

  return (
    <button
      type="button"
      onClick={() => reviewMutation.mutate()}
      disabled={reviewMutation.isPending}
      style={{
        ...btnBase,
        background: "transparent",
        color: "var(--text-secondary)",
        borderColor: "var(--border-strong)",
        opacity: reviewMutation.isPending ? 0.5 : 1,
      }}
    >
      Request Changes
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", opacity: 0.5 }}>r</span>
    </button>
  );
}

function ApproveBarButton({
  cwd,
  prNumber,
  currentUserReview,
}: {
  cwd: string;
  prNumber: number;
  currentUserReview: string | null;
}) {
  const alreadyApproved = currentUserReview === "APPROVED";

  const reviewMutation = useMutation({
    mutationFn: () => ipc("pr.submitReview", { cwd, prNumber, event: "APPROVE" as const }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr"] });
      toastManager.add({ title: "PR approved", type: "success" });
    },
    onError: (err) => {
      toastManager.add({ title: "Review failed", description: String(err.message), type: "error" });
    },
  });

  if (alreadyApproved) {
    return (
      <button
        type="button"
        disabled
        style={{
          ...btnBase,
          background: "var(--success)",
          color: "var(--bg-root)",
          borderColor: "var(--success)",
          opacity: 0.6,
        }}
      >
        <Check size={11} />
        Approved
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => reviewMutation.mutate()}
      disabled={reviewMutation.isPending}
      style={{
        ...btnBase,
        background: "var(--success)",
        color: "var(--bg-root)",
        borderColor: "var(--success)",
        opacity: reviewMutation.isPending ? 0.5 : 1,
      }}
    >
      {reviewMutation.isPending ? <Spinner className="h-3 w-3" /> : "Approve"}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: "9px", opacity: 0.5 }}>a</span>
    </button>
  );
}

function MergeBarButton({
  cwd,
  prNumber,
  pr,
  canAdmin,
  isDraft,
}: {
  cwd: string;
  prNumber: number;
  pr: {
    reviewDecision: string;
    mergeable: string;
    statusCheckRollup: Array<{ conclusion: string | null }>;
  };
  canAdmin: boolean;
  isDraft: boolean;
}) {
  const hasApproval = pr.reviewDecision === "APPROVED";
  const allChecksPassing =
    pr.statusCheckRollup.length > 0 &&
    pr.statusCheckRollup.every((c) => c.conclusion === "success");
  const requirementsMet = hasApproval && allChecksPassing && pr.mergeable === "MERGEABLE";
  const canMerge = requirementsMet || canAdmin;

  const mergeMutation = useMutation({
    mutationFn: () =>
      ipc("pr.merge", {
        cwd,
        prNumber,
        strategy: "squash" as const,
        admin: !requirementsMet && canAdmin ? true : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr"] });
      toastManager.add({
        title: `PR #${prNumber} merged`,
        description: "Branch deleted.",
        type: "success",
      });
    },
    onError: (err) => {
      toastManager.add({ title: "Merge failed", description: String(err.message), type: "error" });
    },
  });

  return (
    <button
      type="button"
      onClick={() => mergeMutation.mutate()}
      disabled={isDraft || !canMerge || mergeMutation.isPending}
      style={{
        ...btnBase,
        background: "var(--accent)",
        color: "var(--bg-root)",
        borderColor: "var(--accent)",
        opacity: isDraft || !canMerge ? 0.4 : 1,
        cursor: isDraft || !canMerge ? "not-allowed" : "pointer",
      }}
    >
      {mergeMutation.isPending ? <Spinner className="h-3 w-3" /> : <GitMerge size={11} />}
      Squash & Merge
    </button>
  );
}
