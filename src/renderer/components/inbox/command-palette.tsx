import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandEmpty,
  CommandFooter,
  CommandInput,
  CommandList,
  CommandPanel,
  useCommandFilters,
  useCommandQuery,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useKeyboardShortcuts } from "@/renderer/hooks/app/use-keyboard-shortcuts";
import { useCommandPalette } from "@/renderer/lib/app/command-palette-context";
import { useKeybindings } from "@/renderer/lib/keyboard/keybinding-context";

import { QuickActionsGroup, RecentPRsGroup } from "./command-palette-curated";
import {
  ActionsGroup,
  FileGroup,
  PullRequestGroup,
  ReviewActionsGroup,
  WorkspaceGroup,
} from "./command-palette-groups";

/**
 * Command palette — ⌘K global search and action launcher.
 *
 * ## What this does
 *
 * With no query: shows recent PRs + context-aware quick actions.
 * With a query: searches across PRs, files, actions, and workspaces.
 *
 * ## Smart filters
 *
 * | Filter              | Example                     | Matches                        |
 * |---------------------|-----------------------------|--------------------------------|
 * | `#N` / `pr:N`       | `#3350`, `pr:100`           | Exact PR number                |
 * | `@name` / `author:` | `@john`, `author:jane`      | Author login (substring)       |
 * | `branch:`           | `branch:feat/new`           | Head or base branch            |
 * | `is:` / `state:`    | `is:draft`, `is:approved`   | PR state or review status      |
 * | `size:`             | `size:s`, `size:xl`         | Change size (xs/s/m/l/xl)      |
 * | `file:` / `ext:`    | `file:tsx`, `ext:css`       | File path / extension          |
 *
 * ## Mode prefixes
 *
 * | Prefix | Shows                              |
 * |--------|------------------------------------|
 * | `>`    | Actions only (review, general)     |
 * | `#`    | Pull requests only                 |
 * | `/`    | Files in current PR diff           |
 */

export function CommandPalette() {
  const { open, setOpen } = useCommandPalette();
  const { getBinding } = useKeybindings();

  useKeyboardShortcuts([
    { ...getBinding("search.commandPalette"), handler: () => setOpen(true) },
    { ...getBinding("search.commandPaletteAlt"), handler: () => setOpen(true) },
  ]);

  const close = () => setOpen(false);

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
    >
      <CommandDialogPopup
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.stopPropagation();
            close();
          }
        }}
      >
        <Command key={open ? "open" : "closed"}>
          <CommandInput placeholder="Search PRs, files, actions…" />
          <CommandPanel>
            <CommandList>
              <CommandPaletteContent onSelect={close} />
            </CommandList>
          </CommandPanel>
          <CommandFooter>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Kbd>↑↓</Kbd>
                <span>navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>↵</Kbd>
                <span>select</span>
              </span>
              <span className="flex items-center gap-1">
                <Kbd>esc</Kbd>
                <span>close</span>
              </span>
            </div>
            <span className="text-text-ghost flex items-center gap-2 text-[10px]">
              <span>
                <Kbd>&gt;</Kbd> actions
              </span>
              <span>
                <Kbd>#</Kbd> PRs
              </span>
              <span>
                <Kbd>/</Kbd> files
              </span>
            </span>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}

/** Renders curated groups when query is empty, full search when typing. */
function CommandPaletteContent({ onSelect }: { onSelect: () => void }) {
  const query = useCommandQuery();
  const { mode } = useCommandFilters();

  // No query — show curated default view
  if (!query) {
    return (
      <>
        <RecentPRsGroup onSelect={onSelect} />
        <QuickActionsGroup onSelect={onSelect} />
      </>
    );
  }

  // Mode-filtered search
  if (mode === "commands") {
    return (
      <>
        <ReviewActionsGroup onSelect={onSelect} />
        <ActionsGroup onSelect={onSelect} />
        <CommandEmptyTips />
      </>
    );
  }

  if (mode === "prs") {
    return (
      <>
        <PullRequestGroup onSelect={onSelect} />
        <CommandEmptyTips />
      </>
    );
  }

  if (mode === "files") {
    return (
      <>
        <FileGroup onSelect={onSelect} />
        <CommandEmptyTips />
      </>
    );
  }

  // Default: search everything
  return (
    <>
      <PullRequestGroup onSelect={onSelect} />
      <FileGroup onSelect={onSelect} />
      <ReviewActionsGroup onSelect={onSelect} />
      <WorkspaceGroup onSelect={onSelect} />
      <ActionsGroup onSelect={onSelect} />
      <CommandEmptyTips />
    </>
  );
}

function CommandEmptyTips() {
  return (
    <CommandEmpty>
      <div className="flex flex-col items-center gap-3 py-6">
        <p className="text-text-secondary text-sm">No results found</p>
        <div className="text-text-ghost flex flex-col gap-1 text-[11px]">
          <p className="text-text-tertiary mb-1 text-[10px] font-medium tracking-wider uppercase">
            Try a filter
          </p>
          <span>
            <code className="text-text-tertiary font-mono">#1234</code> PR number
          </span>
          <span>
            <code className="text-text-tertiary font-mono">@name</code> author
          </span>
          <span>
            <code className="text-text-tertiary font-mono">is:draft</code> status
          </span>
          <span>
            <code className="text-text-tertiary font-mono">branch:feat</code> branch name
          </span>
          <span>
            <code className="text-text-tertiary font-mono">file:tsx</code> file extension
          </span>
        </div>
      </div>
    </CommandEmpty>
  );
}
