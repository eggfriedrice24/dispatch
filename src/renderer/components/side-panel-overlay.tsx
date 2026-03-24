import type { GhPrDetail } from "@/shared/ipc";

import { relativeTime } from "@/shared/format";
import { useQuery } from "@tanstack/react-query";
import { Check, X, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { ipc } from "../lib/ipc";
import { summarizePrChecks } from "../lib/pr-check-status";
import { useWorkspace } from "../lib/workspace-context";
import { ConversationTab } from "./conversation-tab";
import { GitHubAvatar } from "./github-avatar";
import { MarkdownBody } from "./markdown-body";

/**
 * Side panel overlay — PR-REVIEW-REDESIGN.md § Side Panel
 *
 * 380px overlay that slides from right with backdrop.
 * Tabs: Overview, Conversation, Commits, Checks
 */

type PanelTab = "overview" | "conversation" | "commits" | "checks";

interface SidePanelOverlayProps {
  open: boolean;
  onClose: () => void;
  pr: GhPrDetail;
  prNumber: number;
  issueComments: Array<{ id: string; body: string; author: { login: string }; createdAt: string }>;
  repo: string;
  highlightedLogin: string | null;
  onReviewClick: (login: string) => void;
  diffSnippet: string;
}

export function SidePanelOverlay({
  open,
  onClose,
  pr,
  prNumber,
  issueComments,
  repo,
  onReviewClick,
}: SidePanelOverlayProps) {
  const [activeTab, setActiveTab] = useState<PanelTab>("overview");

  return (
    <>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 z-[4] transition-opacity duration-[400ms] ease-out ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{ background: "rgba(0,0,0,0.25)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`bg-bg-surface absolute top-0 right-0 bottom-0 z-[5] flex w-[380px] flex-col transition-transform duration-[400ms] ${
          open ? "pointer-events-auto translate-x-0" : "pointer-events-none translate-x-full"
        }`}
        style={{
          borderLeft: "1px solid var(--border)",
          boxShadow: open ? "-4px 0 24px rgba(0,0,0,0.4)" : "none",
          transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header — 36px, tabs + close */}
        <div
          className="flex shrink-0 items-center"
          style={{
            height: "36px",
            padding: "0 8px",
            borderBottom: "1px solid var(--border)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        >
          <div className="flex flex-1 gap-0">
            <PanelTabButton
              label="Overview"
              active={activeTab === "overview"}
              onClick={() => setActiveTab("overview")}
            />
            <PanelTabButton
              label="Conversation"
              count={issueComments.length + pr.reviews.length}
              active={activeTab === "conversation"}
              onClick={() => setActiveTab("conversation")}
            />
            <PanelTabButton
              label="Commits"
              active={activeTab === "commits"}
              onClick={() => setActiveTab("commits")}
            />
            <PanelTabButton
              label="Checks"
              count={pr.statusCheckRollup.length}
              active={activeTab === "checks"}
              onClick={() => setActiveTab("checks")}
              danger={pr.statusCheckRollup.some((c) => c.conclusion === "failure")}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-text-ghost hover:text-text-primary hover:bg-bg-raised flex h-6 w-6 cursor-pointer items-center justify-center rounded-sm transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Conversation tab manages its own scroll + composer */}
        {activeTab === "conversation" ? (
          <ConversationTab
            prNumber={prNumber}
            reviews={pr.reviews}
            issueComments={issueComments}
            repo={repo}
            onReviewClick={onReviewClick}
          />
        ) : (
          <div
            className="flex-1 overflow-y-auto"
            style={{ padding: "12px" }}
          >
            {activeTab === "overview" && (
              <PanelOverviewContent
                pr={pr}
                prNumber={prNumber}
                repo={repo}
              />
            )}
            {activeTab === "commits" && <PanelCommitsContent prNumber={prNumber} />}
            {activeTab === "checks" && <PanelChecksContent prNumber={prNumber} />}
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Overview tab — matches mockup's overview-card, labels, reviewers, AI summary
// ---------------------------------------------------------------------------

function PanelOverviewContent({ pr, repo }: { pr: GhPrDetail; prNumber: number; repo: string }) {
  return (
    <>
      {/* Description card */}
      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "10px 12px",
          marginBottom: "10px",
        }}
      >
        <div
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "6px",
          }}
        >
          Description
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
          {pr.body ? (
            <MarkdownBody
              content={pr.body}
              repo={repo}
            />
          ) : (
            <span style={{ fontStyle: "italic" }}>No description provided.</span>
          )}
        </div>
      </div>

      {/* Labels */}
      <div style={{ marginBottom: "12px" }}>
        <div
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "var(--text-tertiary)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "6px",
          }}
        >
          Labels
        </div>
        <div className="flex flex-wrap gap-1">
          {/* TODO: wire to actual PR labels when available */}
          <span
            style={{
              display: "inline-flex",
              padding: "1px 8px",
              borderRadius: "var(--radius-full)",
              fontSize: "10px",
              fontWeight: 500,
              background: "var(--bg-elevated)",
              color: "var(--text-ghost)",
              border: "1px dashed var(--border-strong)",
              cursor: "pointer",
            }}
          >
            + Add
          </span>
        </div>
      </div>

      {/* Reviewers */}
      {pr.reviews.length > 0 && (
        <div style={{ marginBottom: "12px" }}>
          <div
            style={{
              fontSize: "10px",
              fontWeight: 600,
              color: "var(--text-tertiary)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "6px",
            }}
          >
            Reviewers
          </div>
          {dedupeReviews(pr.reviews).map((review) => (
            <div
              key={review.author.login}
              className="flex items-center gap-2"
              style={{ padding: "4px 0", fontSize: "12px" }}
            >
              <GitHubAvatar
                login={review.author.login}
                size={20}
              />
              <span>{review.author.login}</span>
              <span
                className="ml-auto rounded-sm text-[10px] font-medium"
                style={{
                  padding: "0 6px",
                  background:
                    review.state === "APPROVED"
                      ? "var(--success-muted)"
                      : review.state === "CHANGES_REQUESTED"
                        ? "var(--danger-muted)"
                        : "var(--warning-muted)",
                  color:
                    review.state === "APPROVED"
                      ? "var(--success)"
                      : review.state === "CHANGES_REQUESTED"
                        ? "var(--danger)"
                        : "var(--warning)",
                }}
              >
                {review.state === "APPROVED"
                  ? "Approved"
                  : review.state === "CHANGES_REQUESTED"
                    ? "Changes"
                    : "Pending"}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* AI Summary card */}
      <div
        style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
          marginTop: "10px",
        }}
      >
        <div
          className="text-accent-text hover:bg-bg-elevated flex cursor-pointer items-center gap-1.5 select-none"
          style={{
            padding: "8px 10px",
            fontSize: "11px",
            fontWeight: 500,
          }}
        >
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
          </svg>
          AI Summary
        </div>
      </div>
    </>
  );
}

function dedupeReviews(
  reviews: Array<{ author: { login: string }; state: string; submittedAt: string }>,
) {
  const latestByUser = new Map<
    string,
    { author: { login: string }; state: string; submittedAt: string }
  >();
  for (const review of reviews) {
    const existing = latestByUser.get(review.author.login);
    if (!existing || new Date(review.submittedAt) > new Date(existing.submittedAt)) {
      latestByUser.set(review.author.login, review);
    }
  }
  return [...latestByUser.values()];
}

// ---------------------------------------------------------------------------
// Commits tab — SHA pill + message + author · time
// ---------------------------------------------------------------------------

function PanelCommitsContent({ prNumber }: { prNumber: number }) {
  const { cwd } = useWorkspace();

  const commitsQuery = useQuery({
    queryKey: ["pr", "commits", cwd, prNumber],
    queryFn: () => ipc("pr.commits", { cwd, prNumber }),
    staleTime: 60_000,
  });

  const commits = commitsQuery.data ?? [];

  if (commits.length === 0 && commitsQuery.isLoading) {
    return <p className="text-text-tertiary text-xs">Loading commits...</p>;
  }

  if (commits.length === 0) {
    return <p className="text-text-tertiary text-xs">No commits.</p>;
  }

  return (
    <div>
      {commits.map((commit, i) => (
        <div
          key={commit.oid}
          className="flex items-start gap-2"
          style={{
            padding: "8px 0",
            borderBottom: i < commits.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}
        >
          <span
            className="text-info bg-info-muted shrink-0 rounded-sm font-mono text-[10px]"
            style={{ padding: "1px 5px" }}
          >
            {commit.oid.slice(0, 7)}
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-text-primary text-xs">{commit.message.split("\n")[0]}</div>
            <div className="text-text-tertiary mt-0.5 text-[10px]">
              {commit.author} · {relativeTime(new Date(commit.committedDate))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Checks tab — summary + flat item list (compact, matching mockup)
// ---------------------------------------------------------------------------

function PanelChecksContent({ prNumber }: { prNumber: number }) {
  const { cwd } = useWorkspace();

  const checksQuery = useQuery({
    queryKey: ["checks", "list", cwd, prNumber],
    queryFn: () => ipc("checks.list", { cwd, prNumber }),
    staleTime: 10_000,
    refetchInterval: 10_000,
  });

  const checks = checksQuery.data ?? [];
  const summary = useMemo(() => summarizePrChecks(checks), [checks]);

  if (checksQuery.isLoading) {
    return (
      <div className="flex items-center gap-2 py-4">
        <div className="bg-bg-raised h-3 w-3 animate-pulse rounded-full" />
        <span className="text-text-tertiary text-xs">Loading checks...</span>
      </div>
    );
  }

  if (checks.length === 0) {
    return (
      <div className="py-4 text-center">
        <span className="text-text-tertiary text-xs">No CI checks configured</span>
      </div>
    );
  }

  return (
    <div>
      {/* Summary line */}
      <div
        className="flex items-center gap-[5px] font-medium"
        style={{
          padding: "6px 0 10px",
          fontSize: "12px",
          color: summary.failed > 0 ? "var(--danger)" : "var(--success)",
        }}
      >
        {summary.failed > 0 ? <XCircle size={13} /> : <Check size={13} />}
        {summary.failed > 0
          ? `${summary.failed} failed, ${summary.passed} passed`
          : `${summary.passed} passed`}
      </div>

      {/* Check items */}
      {checks.map((check, i) => {
        const failed = check.conclusion === "failure";
        const duration =
          check.completedAt && check.startedAt
            ? formatDuration(
                new Date(check.completedAt).getTime() - new Date(check.startedAt).getTime(),
              )
            : "—";

        return (
          <div
            key={check.name}
            className="flex items-center gap-1.5"
            style={{
              padding: "5px 0",
              borderBottom: i < checks.length - 1 ? "1px solid var(--border-subtle)" : "none",
              fontSize: "12px",
            }}
          >
            <span
              className="shrink-0"
              style={{ color: failed ? "var(--danger)" : "var(--success)" }}
            >
              {failed ? <XCircle size={12} /> : <Check size={12} />}
            </span>
            <span
              className="min-w-0 flex-1 truncate"
              style={{ color: "var(--text-secondary)" }}
            >
              {check.name}
            </span>
            <span
              className="font-mono"
              style={{ fontSize: "10px", color: "var(--text-tertiary)" }}
            >
              {duration}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}

// ---------------------------------------------------------------------------
// Tab button
// ---------------------------------------------------------------------------

function PanelTabButton({
  label,
  count,
  active,
  onClick,
  danger,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex cursor-pointer items-center gap-[5px] select-none"
      style={{
        padding: "0 10px",
        height: "36px",
        fontSize: "12px",
        fontWeight: active ? 500 : 450,
        color: active ? "var(--text-primary)" : "var(--text-tertiary)",
        borderBottom: active ? "1.5px solid var(--accent)" : "1.5px solid transparent",
      }}
    >
      {label}
      {count !== undefined && count > 0 && (
        <span
          className="font-mono"
          style={{
            fontSize: "9px",
            padding: "0 4px",
            borderRadius: "3px",
            background: danger ? "var(--danger-muted)" : "var(--bg-raised)",
            color: danger ? "var(--danger)" : "var(--text-tertiary)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
