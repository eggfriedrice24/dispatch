import type { GhWorkflowRun } from "@/shared/ipc";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { relativeTime } from "@/shared/format";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronDown, Clock, Play, RotateCcw, Square, XCircle } from "lucide-react";
import { useMemo, useState } from "react";

import { ipc } from "../lib/ipc";
import { queryClient } from "../lib/trpc";
import { useWorkspace } from "../lib/workspace-context";
import { RunDetail } from "./run-detail";

/**
 * Workflows dashboard — Phase 2 B1
 *
 * Lists workflows, shows run history, trigger new runs.
 */

export function WorkflowsDashboard() {
  const { cwd } = useWorkspace();
  const [selectedWorkflow, setSelectedWorkflow] = useState<number | null>(null);
  const [selectedRun, setSelectedRun] = useState<number | null>(null);
  const [workflowMenuOpen, setWorkflowMenuOpen] = useState(false);

  // Workflows list
  const workflowsQuery = useQuery({
    queryKey: ["workflows", "list", cwd],
    queryFn: () => ipc("workflows.list", { cwd }),
  });
  const workflows = workflowsQuery.data ?? [];

  // Workflow runs (filtered by selected workflow)
  const runsQuery = useQuery({
    queryKey: ["workflows", "runs", cwd, selectedWorkflow],
    queryFn: () =>
      ipc("workflows.runs", {
        cwd,
        workflowId: selectedWorkflow ?? undefined,
        limit: 30,
      }),
    refetchInterval: 15_000,
  });
  const runs = runsQuery.data ?? [];

  const selectedWorkflowName = useMemo(() => {
    if (!selectedWorkflow) {
      return "All workflows";
    }
    return workflows.find((w) => w.id === selectedWorkflow)?.name ?? "Unknown";
  }, [selectedWorkflow, workflows]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="border-border bg-bg-surface flex shrink-0 items-center gap-3 border-b px-5 py-3">
        {/* Workflow selector */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setWorkflowMenuOpen(!workflowMenuOpen)}
            className="border-border bg-bg-raised text-text-primary hover:bg-bg-elevated flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs"
          >
            {selectedWorkflowName}
            <ChevronDown
              size={12}
              className="text-text-tertiary"
            />
          </button>
          {workflowMenuOpen && (
            <div className="border-border bg-bg-elevated absolute top-full left-0 z-20 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border p-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setSelectedWorkflow(null);
                  setWorkflowMenuOpen(false);
                }}
                className={`flex w-full rounded-sm px-3 py-1.5 text-left text-xs transition-colors ${
                  !selectedWorkflow
                    ? "bg-accent-muted text-accent-text"
                    : "text-text-secondary hover:bg-bg-raised"
                }`}
              >
                All workflows
              </button>
              {workflows.map((wf) => (
                <button
                  key={wf.id}
                  type="button"
                  onClick={() => {
                    setSelectedWorkflow(wf.id);
                    setWorkflowMenuOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-xs transition-colors ${
                    selectedWorkflow === wf.id
                      ? "bg-accent-muted text-accent-text"
                      : "text-text-secondary hover:bg-bg-raised"
                  }`}
                >
                  <div
                    className={`h-1.5 w-1.5 rounded-full ${
                      wf.state === "active" ? "bg-success" : "bg-text-ghost"
                    }`}
                  />
                  {wf.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1" />

        {/* Trigger button */}
        {selectedWorkflow && (
          <TriggerButton
            cwd={cwd}
            workflowId={selectedWorkflow}
          />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Run list */}
        <div className="flex-1 overflow-y-auto">
          {runsQuery.isLoading && (
            <div className="flex items-center justify-center py-12">
              <Spinner className="text-primary h-5 w-5" />
            </div>
          )}

          {!runsQuery.isLoading && runs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12">
              <p className="text-text-tertiary text-sm">No workflow runs found</p>
            </div>
          )}

          {runs.length > 0 && (
            <RunTable
              runs={runs}
              selectedRun={selectedRun}
              onSelectRun={setSelectedRun}
              cwd={cwd}
            />
          )}
        </div>

        {/* Run detail panel */}
        {selectedRun && (
          <div className="border-border bg-bg-surface w-[420px] shrink-0 overflow-y-auto border-l">
            <RunDetail
              cwd={cwd}
              runId={selectedRun}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Run table
// ---------------------------------------------------------------------------

function RunTable({
  runs,
  selectedRun,
  onSelectRun,
  cwd,
}: {
  runs: GhWorkflowRun[];
  selectedRun: number | null;
  onSelectRun: (id: number) => void;
  cwd: string;
}) {
  return (
    <table className="w-full">
      <thead>
        <tr className="border-border-subtle text-text-tertiary border-b text-left text-[11px] font-medium">
          <th className="px-5 py-2">Status</th>
          <th className="px-3 py-2">Title</th>
          <th className="px-3 py-2">Branch</th>
          <th className="px-3 py-2">Duration</th>
          <th className="px-3 py-2">Time</th>
          <th className="px-3 py-2" />
        </tr>
      </thead>
      <tbody>
        {runs.map((run) => (
          <RunRow
            key={run.databaseId}
            run={run}
            isSelected={selectedRun === run.databaseId}
            onClick={() => onSelectRun(run.databaseId)}
            cwd={cwd}
          />
        ))}
      </tbody>
    </table>
  );
}

function RunRow({
  run,
  isSelected,
  onClick,
  cwd,
}: {
  run: GhWorkflowRun;
  isSelected: boolean;
  onClick: () => void;
  cwd: string;
}) {
  const statusIcon = resolveRunStatusIcon(run.status, run.conclusion);
  const duration = computeDuration(run.createdAt, run.updatedAt);

  const cancelMutation = useMutation({
    mutationFn: () => ipc("workflows.cancel", { cwd, runId: run.databaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toastManager.add({ title: "Run cancelled", type: "success" });
    },
  });

  const rerunMutation = useMutation({
    mutationFn: () => ipc("workflows.rerunAll", { cwd, runId: run.databaseId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toastManager.add({ title: "Re-run started", type: "success" });
    },
  });

  return (
    <tr
      onClick={onClick}
      className={`border-border-subtle cursor-pointer border-b text-xs transition-colors ${
        isSelected ? "bg-accent-muted" : "hover:bg-bg-raised"
      }`}
    >
      <td className="px-5 py-2.5">
        <statusIcon.icon
          size={15}
          className={`${statusIcon.color} ${statusIcon.spin ? "animate-spin" : ""}`}
        />
      </td>
      <td className="max-w-[280px] truncate px-3 py-2.5">
        <span className="text-text-primary font-medium">{run.displayTitle}</span>
        <br />
        <span className="text-text-tertiary font-mono text-[10px]">{run.workflowName}</span>
      </td>
      <td className="px-3 py-2.5">
        <span className="bg-bg-raised text-accent-text rounded-sm px-1.5 py-0.5 font-mono text-[11px]">
          {run.headBranch}
        </span>
      </td>
      <td className="text-text-tertiary px-3 py-2.5 font-mono text-[11px]">{duration}</td>
      <td className="text-text-tertiary px-3 py-2.5 font-mono text-[11px]">
        {relativeTime(new Date(run.createdAt))}
      </td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-1">
          {(run.conclusion === "failure" || run.conclusion === "cancelled") && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                rerunMutation.mutate();
              }}
              className="text-text-tertiary hover:bg-bg-raised hover:text-text-primary rounded-sm p-1"
              title="Re-run"
            >
              <RotateCcw
                size={12}
                className={rerunMutation.isPending ? "animate-spin" : ""}
              />
            </button>
          )}
          {run.status === "in_progress" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cancelMutation.mutate();
              }}
              className="text-text-tertiary hover:bg-bg-raised hover:text-destructive rounded-sm p-1"
              title="Cancel"
            >
              <Square size={12} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Trigger button
// ---------------------------------------------------------------------------

function TriggerButton({ cwd, workflowId }: { cwd: string; workflowId: number }) {
  const [open, setOpen] = useState(false);
  const [ref, setRef] = useState("main");

  const triggerMutation = useMutation({
    mutationFn: () => ipc("workflows.trigger", { cwd, workflowId: String(workflowId), ref }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
      toastManager.add({ title: "Workflow triggered", type: "success" });
      setOpen(false);
    },
    onError: (err) => {
      toastManager.add({
        title: "Trigger failed",
        description: String(err.message),
        type: "error",
      });
    },
  });

  return (
    <div className="relative">
      <Button
        size="sm"
        className="bg-primary text-primary-foreground hover:bg-accent-hover gap-1.5"
        onClick={() => setOpen(!open)}
      >
        <Play size={12} />
        Trigger
      </Button>
      {open && (
        <div className="border-border bg-bg-elevated absolute top-full right-0 z-20 mt-1 w-64 rounded-md border p-3 shadow-lg">
          <label className="text-text-secondary text-[11px] font-medium">Branch / Ref</label>
          <input
            type="text"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            className="border-border bg-bg-root text-text-primary focus:border-primary mt-1 w-full rounded-md border px-3 py-1.5 text-xs focus:outline-none"
          />
          <div className="mt-3 flex justify-end gap-1.5">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-accent-hover"
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending || !ref.trim()}
            >
              {triggerMutation.isPending ? <Spinner className="h-3 w-3" /> : "Run"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function resolveRunStatusIcon(status: string, conclusion: string | null) {
  if (conclusion === "success") {
    return { icon: CheckCircle2, color: "text-success", spin: false };
  }
  if (conclusion === "failure" || conclusion === "error") {
    return { icon: XCircle, color: "text-destructive", spin: false };
  }
  if (conclusion === "cancelled") {
    return { icon: XCircle, color: "text-text-tertiary", spin: false };
  }
  if (status === "in_progress" || status === "queued") {
    return { icon: Clock, color: "text-warning", spin: true };
  }
  return { icon: Clock, color: "text-text-ghost", spin: false };
}

function computeDuration(startedAt: string, completedAt: string): string {
  const start = new Date(startedAt).getTime();
  const end = new Date(completedAt).getTime();
  const seconds = Math.floor((end - start) / 1000);
  if (seconds < 0) {
    return "—";
  }
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
}
