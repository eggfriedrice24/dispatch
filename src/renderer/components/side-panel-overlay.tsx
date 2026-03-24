import type { GhPrDetail } from "@/shared/ipc";

import { X } from "lucide-react";
import { useState } from "react";

import { ChecksPanel } from "./checks-panel";
import { ConversationTab } from "./conversation-tab";
import { OverviewTab } from "./overview-tab";

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
  highlightedLogin,
  onReviewClick,
  diffSnippet,
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
        {/* Header with tabs — 36px, border-bottom + shadow */}
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

        {/* Tab content — conversation tab manages its own scroll + composer */}
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
            style={{ padding: activeTab === "overview" ? "0" : "12px" }}
          >
            {activeTab === "overview" && (
              <OverviewTab
                pr={pr}
                prNumber={prNumber}
                repo={repo}
                highlightedLogin={highlightedLogin}
                onReviewClick={onReviewClick}
                diffSnippet={diffSnippet}
              />
            )}
            {activeTab === "commits" && (
              <div>
                <p className="text-text-tertiary text-xs">{pr.files.length} files changed</p>
              </div>
            )}
            {activeTab === "checks" && <ChecksPanel prNumber={prNumber} />}
          </div>
        )}
      </div>
    </>
  );
}

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
