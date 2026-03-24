import type { GhPrDetail } from "@/shared/ipc";

import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { useMutation } from "@tanstack/react-query";
import { Check, CheckCircle, Eye, GitMerge, MessageSquare, XCircle } from "lucide-react";

import { ipc } from "../lib/ipc";
import { queryClient } from "../lib/query-client";

/**
 * Floating review bar — PR-REVIEW-REDESIGN.md § Floating Review Bar
 *
 * Frosted glass bar at bottom-center of the diff area.
 * Shows viewed stats, comment count, check status, and action buttons.
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
      className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2"
      style={{
        background: "rgba(28,28,34,0.85)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: "1px solid var(--border-strong)",
        borderRadius: "var(--radius-xl)",
        padding: "5px 5px 5px 12px",
        boxShadow: "var(--shadow-lg), var(--shadow-glow)",
      }}
    >
      {/* Stats */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-[3px]">
          <Eye
            size={12}
            className="text-text-tertiary"
          />
          <span className="text-text-primary font-mono text-[10px]">
            {viewedCount}/{totalFiles}
          </span>
        </div>

        <div className="flex items-center gap-[3px]">
          <MessageSquare
            size={12}
            className="text-text-tertiary"
          />
          <span className="text-text-primary font-mono text-[10px]">{commentCount}</span>
        </div>

        <div className="flex items-center gap-[3px]">
          {failCount > 0 ? (
            <XCircle
              size={12}
              className="text-destructive"
            />
          ) : (
            <CheckCircle
              size={12}
              className={allPassing ? "text-success" : "text-text-tertiary"}
            />
          )}
          <span
            className={`font-mono text-[10px] ${
              failCount > 0 ? "text-destructive" : allPassing ? "text-success" : "text-text-primary"
            }`}
          >
            {failCount > 0
              ? `${failCount} failed`
              : checkSummary.length > 0
                ? `${passCount}/${checkSummary.length}`
                : "—"}
          </span>
        </div>
      </div>

      {/* Separator */}
      <div
        className="h-[18px] w-px shrink-0"
        style={{ background: "var(--border)" }}
      />

      {/* Action buttons */}
      <div className="flex items-center gap-[3px]">
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
// Bar-specific button variants
// ---------------------------------------------------------------------------

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
      className="border-border-strong hover:bg-bg-raised hover:text-text-primary flex cursor-pointer items-center gap-1 rounded-md border bg-transparent text-[11px] font-medium whitespace-nowrap transition-colors select-none disabled:opacity-50"
      style={{ padding: "5px 10px", color: "var(--text-secondary)" }}
    >
      Request Changes
      <span className="font-mono text-[9px] opacity-50">r</span>
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
        className="flex items-center gap-1 rounded-md border border-transparent text-[11px] font-medium whitespace-nowrap opacity-60 select-none"
        style={{ padding: "5px 10px", background: "var(--success)", color: "var(--bg-root)" }}
      >
        <Check size={12} />
        Approved
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => reviewMutation.mutate()}
      disabled={reviewMutation.isPending}
      className="flex cursor-pointer items-center gap-1 rounded-md border border-transparent text-[11px] font-medium whitespace-nowrap transition-[filter,box-shadow] select-none hover:brightness-110 disabled:opacity-50"
      style={{ padding: "5px 10px", background: "var(--success)", color: "var(--bg-root)" }}
    >
      {reviewMutation.isPending ? <Spinner className="h-3 w-3" /> : "Approve"}
      <span className="font-mono text-[9px] opacity-50">a</span>
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

  if (isDraft) {
    return (
      <button
        type="button"
        disabled
        className="flex items-center gap-1 rounded-md border border-transparent text-[11px] font-medium whitespace-nowrap opacity-40 select-none"
        style={{ padding: "5px 10px", background: "var(--accent)", color: "var(--bg-root)" }}
      >
        <GitMerge size={12} />
        Squash & Merge
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => mergeMutation.mutate()}
      disabled={!canMerge || mergeMutation.isPending}
      className="flex cursor-pointer items-center gap-1 rounded-md border border-transparent text-[11px] font-medium whitespace-nowrap transition-[filter,box-shadow] select-none hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        padding: "5px 10px",
        background: requirementsMet
          ? "var(--accent)"
          : canAdmin
            ? "var(--warning)"
            : "var(--accent)",
        color: "var(--bg-root)",
        boxShadow: canMerge ? "var(--shadow-glow)" : "none",
      }}
    >
      {mergeMutation.isPending ? <Spinner className="h-3 w-3" /> : <GitMerge size={12} />}
      Squash & Merge
    </button>
  );
}
