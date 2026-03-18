import { useQuery } from "@tanstack/react-query";
import { ChevronDown, FolderOpen, GitBranch, GitPullRequest, Settings, Zap } from "lucide-react";
import { useState } from "react";

import { ipc } from "../lib/ipc";
import { useRouter } from "../lib/router";
import { queryClient } from "../lib/trpc";
import { useWorkspace } from "../lib/workspace-context";

/**
 * Navbar — DISPATCH-DESIGN-SYSTEM.md § 8.1
 *
 * Route-aware tabs: Review | Workflows
 * Workspace switcher in the right area
 */
export function Navbar({ selectedPr }: { selectedPr?: number | null }) {
  const { route, navigate } = useRouter();

  return (
    <header
      className="border-border bg-bg-surface flex h-10 shrink-0 items-center border-b pr-3"
      style={{ WebkitAppRegion: "drag", paddingLeft: 80 } as React.CSSProperties}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-[7px]"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <div className="bg-primary flex h-5 w-5 items-center justify-center rounded-sm">
          <span className="font-heading text-bg-root text-sm leading-none italic">d</span>
        </div>
        <span className="text-text-primary text-[13px] font-semibold tracking-[-0.02em]">
          Dispatch
        </span>
      </div>

      {/* Nav tabs */}
      <nav
        className="ml-6 flex items-center gap-0.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <NavTab
          label="Review"
          icon={<GitPullRequest size={14} />}
          active={route.view === "review"}
          onClick={() => navigate({ view: "review", prNumber: selectedPr ?? null })}
        />
        <NavTab
          label="Workflows"
          icon={<Zap size={14} />}
          active={route.view === "workflows"}
          onClick={() => navigate({ view: "workflows" })}
        />
        {route.view === "review" && selectedPr && (
          <>
            <span className="text-text-ghost mx-1 text-[11px]">/</span>
            <span className="text-text-tertiary font-mono text-[11px]">#{selectedPr}</span>
          </>
        )}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Workspace switcher + icons */}
      <div
        className="flex items-center gap-1.5"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        <WorkspaceSwitcher />

        <div className="bg-border mx-1 h-4 w-px" />

        <IconButton
          icon={<Settings size={15} />}
          onClick={() => navigate({ view: "settings" })}
          active={route.view === "settings"}
        />

        {/* Avatar */}
        <div
          className="ml-1 flex h-6 w-6 items-center justify-center rounded-full"
          style={{
            background: "linear-gradient(135deg, var(--primary), #7c5a2a)",
            border: "1.5px solid var(--border-strong)",
          }}
        >
          <span className="text-bg-root text-[10px] font-semibold">D</span>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Workspace switcher
// ---------------------------------------------------------------------------

function WorkspaceSwitcher() {
  const { cwd } = useWorkspace();
  const [open, setOpen] = useState(false);
  const repoName = cwd.split("/").pop() ?? "—";

  const workspacesQuery = useQuery({
    queryKey: ["workspace", "list"],
    queryFn: () => ipc("workspace.list"),
    staleTime: 60_000,
  });
  const workspaces = workspacesQuery.data ?? [];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="text-text-secondary hover:bg-bg-raised hover:text-text-primary flex items-center gap-1.5 rounded-sm px-2 py-1 text-xs"
      >
        <GitBranch
          size={12}
          className="text-primary"
        />
        <span className="max-w-[120px] truncate font-mono text-[11px]">{repoName}</span>
        <ChevronDown
          size={10}
          className="text-text-ghost"
        />
      </button>
      {open && (
        <div className="border-border bg-bg-elevated absolute top-full right-0 z-20 mt-1 w-56 rounded-md border p-1 shadow-lg">
          {workspaces.map((ws) => (
            <button
              key={ws.id}
              type="button"
              onClick={() => {
                ipc("workspace.setActive", { path: ws.path }).then(() => {
                  queryClient.invalidateQueries();
                  setOpen(false);
                  // Force reload to switch workspace context
                  globalThis.location.reload();
                });
              }}
              className={`flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-xs transition-colors ${
                ws.path === cwd
                  ? "bg-accent-muted text-accent-text"
                  : "text-text-secondary hover:bg-bg-raised"
              }`}
            >
              <GitBranch
                size={12}
                className="text-primary shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="text-text-primary truncate font-medium">{ws.name}</p>
                <p className="text-text-tertiary truncate font-mono text-[10px]">{ws.path}</p>
              </div>
            </button>
          ))}
          <div className="border-border mt-0.5 border-t pt-0.5">
            <button
              type="button"
              onClick={() => {
                ipc("workspace.pickFolder").then((result) => {
                  if (result) {
                    ipc("workspace.add", { path: result }).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["workspace"] });
                    });
                  }
                });
                setOpen(false);
              }}
              className="text-text-secondary hover:bg-bg-raised hover:text-text-primary flex w-full items-center gap-2 rounded-sm px-3 py-1.5 text-left text-xs"
            >
              <FolderOpen size={12} />
              Add repository...
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function NavTab({
  label,
  icon,
  active = false,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative flex items-center gap-1.5 rounded-sm px-2.5 py-1.5 text-xs transition-colors ${
        active
          ? "text-text-primary font-medium"
          : "text-text-secondary hover:bg-bg-raised hover:text-text-primary font-[450]"
      }`}
    >
      {icon}
      {label}
      {active && (
        <div className="bg-primary absolute bottom-[-7px] left-1/2 h-[1.5px] w-4 -translate-x-1/2 rounded-[1px]" />
      )}
    </button>
  );
}

function IconButton({
  icon,
  onClick,
  active = false,
}: {
  icon: React.ReactNode;
  onClick?: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[30px] w-[30px] items-center justify-center rounded-sm transition-colors ${
        active
          ? "bg-bg-raised text-text-primary"
          : "text-text-secondary hover:bg-bg-raised hover:text-text-primary"
      }`}
    >
      {icon}
    </button>
  );
}
