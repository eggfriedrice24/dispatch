import { useEffect, useRef } from "react";

/**
 * Centralized keyboard shortcut system.
 *
 * Rules:
 * - Never fires when focus is in input/textarea/contenteditable
 * - Supports modifier keys (meta, shift, alt, ctrl)
 * - Shortcuts registered/unregistered on mount/unmount
 */

export interface Shortcut {
  key: string;
  modifiers?: Array<"meta" | "shift" | "alt" | "ctrl">;
  handler: () => void;
  /** Only fire if this returns true */
  when?: () => boolean;
}

function isInputFocused(): boolean {
  const el = document.activeElement;
  if (!el) {
    return false;
  }
  const tag = (el as HTMLElement).tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || (el as HTMLElement).isContentEditable;
}

function matchesModifiers(
  event: KeyboardEvent,
  modifiers: Array<"meta" | "shift" | "alt" | "ctrl"> = [],
): boolean {
  const wantMeta = modifiers.includes("meta");
  const wantShift = modifiers.includes("shift");
  const wantAlt = modifiers.includes("alt");
  const wantCtrl = modifiers.includes("ctrl");

  return (
    event.metaKey === wantMeta &&
    event.shiftKey === wantShift &&
    event.altKey === wantAlt &&
    event.ctrlKey === wantCtrl
  );
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]): void {
  // Use a ref so the handler always sees the latest shortcuts without re-registering
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Skip if typing in an input (unless shortcut has modifiers)
      for (const shortcut of shortcutsRef.current) {
        const hasModifiers = shortcut.modifiers && shortcut.modifiers.length > 0;

        // For non-modifier shortcuts, skip when input is focused
        const skipShortcut = !hasModifiers && isInputFocused();

        if (
          !skipShortcut &&
          event.key === shortcut.key &&
          matchesModifiers(event, shortcut.modifiers) &&
          (!shortcut.when || shortcut.when())
        ) {
          event.preventDefault();
          shortcut.handler();
          return;
        }
      }
    }

    globalThis.addEventListener("keydown", onKeyDown);
    return () => {
      globalThis.removeEventListener("keydown", onKeyDown);
    };
  }, []);
}
