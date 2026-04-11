/* eslint-disable import/max-dependencies -- Curated groups gather cross-cutting command sources. */
import type { GhPrListItemCore, PrActivityState } from "@/shared/ipc";

import {
  CommandGroup,
  CommandGroupLabel,
  CommandItem,
  CommandShortcut,
} from "@/components/ui/command";
import { toastManager } from "@/components/ui/toast";
import {
  formatAuthorName,
  useDisplayNameFormat,
} from "@/renderer/hooks/preferences/use-display-name";
import { ipc } from "@/renderer/lib/app/ipc";
import { openExternal } from "@/renderer/lib/app/open-external";
import { queryClient } from "@/renderer/lib/app/query-client";
import { useRouter } from "@/renderer/lib/app/router";
import { useWorkspace } from "@/renderer/lib/app/workspace-context";
import { useQuery } from "@tanstack/react-query";
import { Check, ClipboardCopy, Clock, ExternalLink, GitMerge, MessageSquare } from "lucide-react";
import { useMemo } from "react";

import { PrStatusIcon } from "./command-palette-groups";

// ---------------------------------------------------------------------------
// Recent PRs — jump back to something you were just looking at
// ---------------------------------------------------------------------------

export function RecentPRsGroup({ onSelect }: { onSelect: () => void }) {
  const { nwo, repoTarget } = useWorkspace();
  const { navigate } = useRouter();
  const nameFormat = useDisplayNameFormat();

  const activityQuery = useQuery({
    queryKey: ["pr-activity", "list"],
    queryFn: () => ipc("prActivity.list"),
    staleTime: 30_000,
  });

  const reviewQuery = useQuery({
    queryKey: ["pr", "list", nwo, "reviewRequested"],
    queryFn: () => ipc("pr.list", { ...repoTarget, filter: "reviewRequested" }),
    staleTime: 30_000,
  });
  const authorQuery = useQuery({
    queryKey: ["pr", "list", nwo, "authored"],
    queryFn: () => ipc("pr.list", { ...repoTarget, filter: "authored" }),
    staleTime: 30_000,
  });
  const allQuery = useQuery({
    queryKey: ["pr", "list", nwo, "all", "all"],
    queryFn: () => ipc("pr.list", { ...repoTarget, filter: "all", state: "all" }),
    staleTime: 30_000,
  });

  const recentPrs = useMemo(() => {
    const activities = activityQuery.data ?? [];
    const prMap = new Map<number, GhPrListItemCore>();
    for (const pr of [
      ...(reviewQuery.data ?? []),
      ...(authorQuery.data ?? []),
      ...(allQuery.data ?? []),
    ]) {
      prMap.set(pr.number, pr);
    }

    const matched: { pr: GhPrListItemCore; activity: PrActivityState }[] = [];
    for (const activity of activities) {
      if (activity.repo === nwo) {
        const pr = prMap.get(activity.prNumber);
        if (pr) {
          matched.push({ pr, activity });
        }
      }
    }

    matched.sort((a, b) => b.activity.seenAt.localeCompare(a.activity.seenAt));
    return matched.slice(0, 5);
  }, [activityQuery.data, reviewQuery.data, authorQuery.data, allQuery.data, nwo]);

  if (recentPrs.length === 0) {
    return null;
  }

  return (
    <CommandGroup>
      <CommandGroupLabel>
        <Clock
          size={11}
          className="mr-1 inline"
        />
        Recent
      </CommandGroupLabel>
      {recentPrs.map(({ pr }) => (
        <CommandItem
          key={pr.number}
          onSelect={() => {
            navigate({ view: "review", prNumber: pr.number });
            onSelect();
          }}
        >
          <PrStatusIcon pr={pr} />
          <span className="min-w-0 flex-1 truncate">{pr.title}</span>
          <span className="text-text-ghost shrink-0 font-mono text-[10px]">#{pr.number}</span>
          <span className="text-text-ghost shrink-0 text-[10px]">
            {formatAuthorName(pr.author, nameFormat)}
          </span>
        </CommandItem>
      ))}
    </CommandGroup>
  );
}

// ---------------------------------------------------------------------------
// Quick Actions — the 3-4 things you're most likely to do right now
// ---------------------------------------------------------------------------

export function QuickActionsGroup({ onSelect }: { onSelect: () => void }) {
  const { nwo, repoTarget } = useWorkspace();
  const { route } = useRouter();

  const prNumber = route.view === "review" ? route.prNumber : null;

  const repoInfo = useQuery({
    queryKey: ["repo", "info", nwo],
    queryFn: () => ipc("repo.info", { ...repoTarget }),
    staleTime: 300_000,
  });
  const repoSlug = repoInfo.data?.nameWithOwner ?? "";

  // Fetch PR detail when reviewing a PR (for branch name)
  const detailQuery = useQuery({
    queryKey: ["pr", "detail", nwo, prNumber],
    queryFn: () => (prNumber ? ipc("pr.detail", { ...repoTarget, prNumber }) : null),
    staleTime: 30_000,
    enabled: Boolean(prNumber),
  });
  const pr = detailQuery.data;

  const items = useMemo(() => {
    const actions: {
      key: string;
      label: string;
      icon: React.ReactNode;
      shortcut?: string;
      action: () => void;
    }[] = [];

    if (prNumber) {
      // Reviewing a PR — these are the actions you actually reach for
      actions.push(
        {
          key: "approve",
          label: `Approve PR #${prNumber}`,
          shortcut: "a",
          icon: (
            <Check
              size={14}
              className="text-success"
            />
          ),
          action: () => {
            ipc("pr.submitReview", { ...repoTarget, prNumber, event: "APPROVE" }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["pr"] });
              toastManager.add({ title: "PR approved", type: "success" });
            });
            onSelect();
          },
        },
        {
          key: "request-changes",
          label: "Request changes",
          shortcut: "r",
          icon: <MessageSquare size={14} />,
          action: () => {
            globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
            onSelect();
          },
        },
        {
          key: "merge",
          label: `Merge PR #${prNumber}`,
          shortcut: "m",
          icon: (
            <GitMerge
              size={14}
              className="text-purple"
            />
          ),
          action: () => {
            globalThis.dispatchEvent(new KeyboardEvent("keydown", { key: "m", bubbles: true }));
            onSelect();
          },
        },
        {
          key: "copy-branch",
          label: "Copy branch name",
          icon: <ClipboardCopy size={14} />,
          action: () => {
            const branchName = pr?.headRefName ?? "";
            if (branchName) {
              navigator.clipboard.writeText(branchName);
              toastManager.add({ title: `Copied ${branchName}`, type: "success" });
            }
            onSelect();
          },
        },
        {
          key: "open-github",
          label: "Open on GitHub",
          icon: <ExternalLink size={14} />,
          action: () => {
            void openExternal(`https://github.com/${repoSlug}/pull/${prNumber}`);
            onSelect();
          },
        },
      );
    } else {
      // On home/inbox — open repo on GitHub is the most useful escape hatch
      actions.push({
        key: "open-repo",
        label: "Open repo on GitHub",
        icon: <ExternalLink size={14} />,
        action: () => {
          void openExternal(`https://github.com/${repoSlug}`);
          onSelect();
        },
      });
    }

    return actions;
  }, [prNumber, pr, repoTarget, repoSlug, onSelect]);

  return (
    <CommandGroup>
      <CommandGroupLabel>Quick Actions</CommandGroupLabel>
      {items.map((item) => (
        <CommandItem
          key={item.key}
          onSelect={item.action}
        >
          {item.icon}
          {item.label}
          {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
        </CommandItem>
      ))}
    </CommandGroup>
  );
}
