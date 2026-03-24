import type { TriageFile, TriageGroup } from "../lib/triage-classifier";

import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

import { getDiffFilePath } from "../lib/diff-parser";

/**
 * Triage view — PR-REVIEW-REDESIGN.md § Triage mode
 *
 * Groups files into: Needs Attention (orange) / Changed (blue) / Low Risk (gray)
 * Each section is collapsible. Files show badges, annotations, and stats.
 */

interface TriageViewProps {
  groups: TriageGroup;
  currentFileIndex: number;
  onSelectFile: (index: number) => void;
  viewedFiles: Set<string>;
  commentCounts: Map<string, number>;
}

export function TriageView({
  groups,
  currentFileIndex,
  onSelectFile,
  viewedFiles,
  commentCounts,
}: TriageViewProps) {
  const [sections, setSections] = useState({
    attention: true,
    changed: true,
    lowRisk: false,
  });

  function toggleSection(key: "attention" | "changed" | "lowRisk") {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <div className="flex flex-col">
      {groups.attention.length > 0 && (
        <TriageSection
          label="Needs attention"
          dotColor="var(--accent-text)"
          count={groups.attention.length}
          expanded={sections.attention}
          onToggle={() => toggleSection("attention")}
        >
          {groups.attention.map((entry) => (
            <TriageFileItem
              key={entry.fileIndex}
              entry={entry}
              isActive={currentFileIndex === entry.fileIndex}
              isViewed={viewedFiles.has(getDiffFilePath(entry.file))}
              commentCount={commentCounts.get(getDiffFilePath(entry.file)) ?? 0}
              onSelect={() => onSelectFile(entry.fileIndex)}
              isAttention
            />
          ))}
        </TriageSection>
      )}

      {groups.changed.length > 0 && (
        <TriageSection
          label="Changed"
          dotColor="var(--info)"
          count={groups.changed.length}
          expanded={sections.changed}
          onToggle={() => toggleSection("changed")}
        >
          {groups.changed.map((entry) => (
            <TriageFileItem
              key={entry.fileIndex}
              entry={entry}
              isActive={currentFileIndex === entry.fileIndex}
              isViewed={viewedFiles.has(getDiffFilePath(entry.file))}
              commentCount={commentCounts.get(getDiffFilePath(entry.file)) ?? 0}
              onSelect={() => onSelectFile(entry.fileIndex)}
            />
          ))}
        </TriageSection>
      )}

      {groups.lowRisk.length > 0 && (
        <TriageSection
          label="Low risk"
          dotColor="var(--text-ghost)"
          count={groups.lowRisk.length}
          expanded={sections.lowRisk}
          onToggle={() => toggleSection("lowRisk")}
        >
          {groups.lowRisk.map((entry) => (
            <TriageFileItem
              key={entry.fileIndex}
              entry={entry}
              isActive={currentFileIndex === entry.fileIndex}
              isViewed={viewedFiles.has(getDiffFilePath(entry.file))}
              commentCount={commentCounts.get(getDiffFilePath(entry.file)) ?? 0}
              onSelect={() => onSelectFile(entry.fileIndex)}
            />
          ))}
        </TriageSection>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function TriageSection({
  label,
  dotColor,
  count,
  expanded,
  onToggle,
  children,
}: {
  label: string;
  dotColor: string;
  count: number;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-0.5">
      <button
        type="button"
        onClick={onToggle}
        className="hover:bg-bg-raised flex w-full cursor-pointer items-center gap-[5px] rounded-sm text-[10px] font-semibold tracking-[0.06em] uppercase select-none"
        style={{ padding: "4px 7px", color: "var(--text-tertiary)" }}
      >
        <span
          className="h-[5px] w-[5px] shrink-0 rounded-full"
          style={{ background: dotColor }}
        />
        {expanded ? (
          <ChevronDown
            size={10}
            className="text-text-ghost shrink-0"
          />
        ) : (
          <ChevronRight
            size={10}
            className="text-text-ghost shrink-0"
          />
        )}
        {label}
        <span className="text-text-ghost ml-auto font-mono text-[9px] font-normal tracking-normal normal-case">
          {count}
        </span>
      </button>
      {expanded && <div className="flex flex-col">{children}</div>}
    </div>
  );
}

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  added: { label: "A", className: "bg-success-muted text-success" },
  deleted: { label: "D", className: "bg-danger-muted text-destructive" },
  renamed: { label: "R", className: "bg-purple-muted text-purple" },
  modified: { label: "M", className: "bg-warning-muted text-warning" },
};

function TriageFileItem({
  entry,
  isActive,
  isViewed,
  commentCount,
  onSelect,
  isAttention,
}: {
  entry: TriageFile;
  isActive: boolean;
  isViewed: boolean;
  commentCount: number;
  onSelect: () => void;
  isAttention?: boolean;
}) {
  const filePath = getDiffFilePath(entry.file);
  const fileName = filePath.split("/").pop() ?? filePath;
  const badge = STATUS_BADGE[entry.file.status ?? "modified"] ?? STATUS_BADGE.modified!;

  return (
    <div>
      <button
        type="button"
        onClick={onSelect}
        className={`flex w-full cursor-pointer items-center gap-[3px] text-left text-[11px] select-none ${
          isActive
            ? "bg-accent-muted text-text-primary"
            : `text-text-secondary hover:bg-bg-raised hover:text-text-primary`
        } ${isViewed ? "opacity-50" : ""}`}
        style={{
          padding: isActive ? "3px 7px 3px 12px" : "3px 7px 3px 14px",
          borderLeft: isActive ? "2px solid var(--accent)" : "2px solid transparent",
          borderRadius: "var(--radius-sm)",
          boxShadow: isActive
            ? "inset 2px 0 0 var(--accent), 0 0 8px rgba(212,136,58,0.05)"
            : "none",
        }}
      >
        {/* File badge (12x12) */}
        <span
          className={`flex shrink-0 items-center justify-center rounded-xs text-[8px] font-bold ${badge.className}`}
          style={{ width: "12px", height: "12px" }}
        >
          {badge.label}
        </span>

        {/* Filename */}
        <span className="min-w-0 flex-1 truncate font-mono text-[10px]">{fileName}</span>

        {/* Comment badge */}
        {commentCount > 0 && (
          <span className="bg-warning-muted text-warning shrink-0 rounded-xs px-[3px] font-mono text-[8px] font-medium">
            {commentCount}
          </span>
        )}

        {/* Stats */}
        {entry.file.additions > 0 && (
          <span className="text-success shrink-0 font-mono text-[9px]">
            +{entry.file.additions}
          </span>
        )}
        {entry.file.deletions > 0 && (
          <span className="text-destructive shrink-0 font-mono text-[9px]">
            -{entry.file.deletions}
          </span>
        )}
      </button>

      {/* File annotation */}
      {entry.annotation && (
        <div
          className="truncate text-[10px] leading-[1.3]"
          style={{
            padding: "0 7px 2px 27px",
            color: isAttention ? "var(--text-secondary)" : "var(--text-tertiary)",
            fontStyle: isAttention ? "normal" : "italic",
            fontWeight: isAttention ? 450 : 400,
          }}
        >
          {entry.annotation}
        </div>
      )}
    </div>
  );
}
