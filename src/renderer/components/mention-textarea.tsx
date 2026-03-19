import { useQuery } from "@tanstack/react-query";
import { GitPullRequest, MessageCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ipc } from "../lib/ipc";
import { useWorkspace } from "../lib/workspace-context";
import { GitHubAvatar } from "./github-avatar";

/**
 * Textarea with @ mention and # issue/PR autocomplete.
 *
 * Triggers:
 * - `@` → shows user suggestions (PR contributors + repo contributors)
 * - `#` → shows issue/PR suggestions
 *
 * Inserts the selected value at cursor position.
 */

interface MentionTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  prNumber?: number;
  autoFocus?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

type SuggestionKind = "user" | "issue";

interface Suggestion {
  kind: SuggestionKind;
  label: string;
  detail?: string;
  insertText: string;
  login?: string;
  state?: string;
  isPr?: boolean;
}

export function MentionTextarea({
  value,
  onChange,
  placeholder,
  rows = 3,
  className = "",
  prNumber,
  autoFocus,
  onKeyDown: externalOnKeyDown,
}: MentionTextareaProps) {
  const { cwd } = useWorkspace();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [trigger, setTrigger] = useState<{
    kind: SuggestionKind;
    startPos: number;
    query: string;
  } | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch contributors for @ mentions
  const contributorsQuery = useQuery({
    queryKey: ["pr", "contributors", cwd, prNumber],
    queryFn: () => ipc("pr.contributors", { cwd, prNumber: prNumber ?? 0 }),
    enabled: !!prNumber,
    staleTime: 120_000,
  });

  // Fetch issues/PRs for # autocomplete
  const issuesQuery = useQuery({
    queryKey: ["pr", "issuesList", cwd],
    queryFn: () => ipc("pr.issuesList", { cwd }),
    staleTime: 120_000,
  });

  const contributors = contributorsQuery.data ?? [];
  const issues = issuesQuery.data ?? [];

  // Build suggestions based on trigger
  const suggestions = useMemo(() => {
    if (!trigger) {
      return [];
    }
    const q = trigger.query.toLowerCase();

    if (trigger.kind === "user") {
      return contributors
        .filter((login) => login.toLowerCase().includes(q))
        .slice(0, 8)
        .map(
          (login): Suggestion => ({
            kind: "user",
            label: login,
            insertText: `@${login} `,
            login,
          }),
        );
    }

    // # trigger — issues and PRs
    return issues
      .filter((item) => String(item.number).includes(q) || item.title.toLowerCase().includes(q))
      .slice(0, 8)
      .map(
        (item): Suggestion => ({
          kind: "issue",
          label: `#${item.number}`,
          detail: item.title,
          insertText: `#${item.number} `,
          state: item.state,
          isPr: item.isPr,
        }),
      );
  }, [trigger, contributors, issues]);

  // Reset selection when suggestions change
  useEffect(() => {
    setSelectedIndex(0);
  }, [suggestions.length]);

  // Detect trigger characters while typing
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const cursorPos = e.target.selectionStart;
      const textBefore = newValue.slice(0, cursorPos);

      // Find the last @ or # that isn't preceded by a word char
      const atMatch = textBefore.match(/(?:^|[^a-zA-Z0-9])@([a-zA-Z0-9-]*)$/);
      const hashMatch = textBefore.match(/(?:^|[^a-zA-Z0-9])#([a-zA-Z0-9-]*)$/);

      if (atMatch) {
        const startPos = cursorPos - atMatch[1]!.length - 1;
        setTrigger({ kind: "user", startPos, query: atMatch[1]! });
      } else if (hashMatch) {
        const startPos = cursorPos - hashMatch[1]!.length - 1;
        setTrigger({ kind: "issue", startPos, query: hashMatch[1]! });
      } else {
        setTrigger(null);
      }
    },
    [onChange],
  );

  // Insert suggestion
  const insertSuggestion = useCallback(
    (suggestion: Suggestion) => {
      if (!trigger || !textareaRef.current) {
        return;
      }
      const before = value.slice(0, trigger.startPos);
      const cursorPos = textareaRef.current.selectionStart;
      const after = value.slice(cursorPos);
      const newValue = before + suggestion.insertText + after;
      onChange(newValue);
      setTrigger(null);

      // Restore focus + cursor position after insert
      requestAnimationFrame(() => {
        const pos = before.length + suggestion.insertText.length;
        textareaRef.current?.setSelectionRange(pos, pos);
        textareaRef.current?.focus();
      });
    },
    [trigger, value, onChange],
  );

  // Keyboard navigation in dropdown
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (trigger && suggestions.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setSelectedIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0));
          return;
        }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          setSelectedIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1));
          return;
        }
        if (e.key === "Tab" || e.key === "Enter") {
          // Only intercept Enter if autocomplete is open
          if (suggestions[selectedIndex]) {
            e.preventDefault();
            insertSuggestion(suggestions[selectedIndex]!);
            return;
          }
        }
        if (e.key === "Escape") {
          e.preventDefault();
          setTrigger(null);
          return;
        }
      }

      // Pass through to external handler
      externalOnKeyDown?.(e);
    },
    [trigger, suggestions, selectedIndex, insertSuggestion, externalOnKeyDown],
  );

  const showDropdown = trigger !== null && suggestions.length > 0;

  return (
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on dropdown
          setTimeout(() => setTrigger(null), 200);
        }}
        placeholder={placeholder}
        rows={rows}
        autoFocus={autoFocus}
        className={`border-border bg-bg-root text-text-primary placeholder:text-text-tertiary focus:border-primary w-full resize-none rounded-md border px-3 py-2.5 text-xs leading-relaxed focus:outline-none ${className}`}
      />

      {/* Autocomplete dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="border-border bg-bg-elevated absolute bottom-full left-0 z-30 mb-1 max-h-48 w-64 overflow-y-auto rounded-md border p-1 shadow-lg"
        >
          {suggestions.map((suggestion, i) => (
            <button
              key={suggestion.insertText}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertSuggestion(suggestion);
              }}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-xs transition-colors ${
                i === selectedIndex
                  ? "bg-accent-muted text-accent-text"
                  : "text-text-secondary hover:bg-bg-raised"
              }`}
            >
              {suggestion.kind === "user" ? (
                <>
                  <GitHubAvatar
                    login={suggestion.login ?? ""}
                    size={16}
                  />
                  <span className="text-text-primary font-medium">{suggestion.label}</span>
                </>
              ) : (
                <>
                  {suggestion.isPr ? (
                    <GitPullRequest
                      size={13}
                      className="text-text-tertiary shrink-0"
                    />
                  ) : (
                    <MessageCircle
                      size={13}
                      className="text-text-tertiary shrink-0"
                    />
                  )}
                  <span className="text-text-primary shrink-0 font-mono font-medium">
                    {suggestion.label}
                  </span>
                  <span className="text-text-tertiary min-w-0 flex-1 truncate">
                    {suggestion.detail}
                  </span>
                  {suggestion.state && (
                    <span
                      className={`shrink-0 text-[9px] ${
                        suggestion.state === "OPEN"
                          ? "text-success"
                          : suggestion.state === "MERGED"
                            ? "text-info"
                            : "text-text-ghost"
                      }`}
                    >
                      {suggestion.state.toLowerCase()}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
