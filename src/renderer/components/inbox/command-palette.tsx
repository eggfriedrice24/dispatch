/* eslint-disable import/max-dependencies -- The command palette intentionally centralizes cross-cutting navigation and action entrypoints. */
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandFooter,
  CommandInput,
  CommandList,
  CommandPanel,
} from "@/components/ui/command";
import { Kbd } from "@/components/ui/kbd";
import { useKeyboardShortcuts } from "@/renderer/hooks/app/use-keyboard-shortcuts";
import { useKeybindings } from "@/renderer/lib/keyboard/keybinding-context";
import { useState } from "react";

import {
  FileGroup,
  GitGroup,
  NavigationGroup,
  PullRequestGroup,
  ReviewActionsGroup,
  SystemGroup,
  WorkflowGroup,
  WorkspaceGroup,
} from "./command-palette-groups";

/**
 * Command palette — ⌘K global search and action launcher.
 *
 * ## Smart filters
 *
 * Power-user structured filters parsed from the query:
 *
 * | Filter              | Example                     | Matches                        |
 * |---------------------|-----------------------------|--------------------------------|
 * | `#N` / `pr:N`       | `#3350`, `pr:100`           | Exact PR number                |
 * | `@name` / `author:` | `@john`, `author:jane`      | Author login (substring)       |
 * | `branch:`           | `branch:feat/new`           | Head or base branch            |
 * | `is:` / `state:`    | `is:draft`, `is:approved`   | PR state or review status      |
 * | `size:`             | `size:s`, `size:xl`         | Change size (xs/s/m/l/xl)      |
 * | `label:`            | `label:bug`                 | PR label name                  |
 * | `file:` / `ext:`    | `file:tsx`, `ext:css`       | File path / extension          |
 *
 * Remaining text after filters is used for free-text substring search.
 */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
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
      <CommandDialogPopup>
        <Command key={open ? "open" : "closed"}>
          <CommandInput placeholder="Search commands… #pr @author is:draft size:s" />
          <CommandPanel>
            <CommandList>
              <PullRequestGroup onSelect={close} />
              <FileGroup onSelect={close} />
              <ReviewActionsGroup onSelect={close} />
              <NavigationGroup onSelect={close} />
              <WorkspaceGroup onSelect={close} />
              <WorkflowGroup onSelect={close} />
              <GitGroup onSelect={close} />
              <SystemGroup onSelect={close} />
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
            <span className="text-text-ghost text-[10px]">
              <Kbd>⌘K</Kbd> or <Kbd>⇧⌘P</Kbd>
            </span>
          </CommandFooter>
        </Command>
      </CommandDialogPopup>
    </CommandDialog>
  );
}
