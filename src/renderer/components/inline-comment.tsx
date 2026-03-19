import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { relativeTime } from "@/shared/format";
import { useMutation } from "@tanstack/react-query";
import { Check, CheckCircle2, Circle, ChevronDown, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { ipc } from "../lib/ipc";
import { queryClient } from "../lib/query-client";
import { useWorkspace } from "../lib/workspace-context";
import { MarkdownBody } from "./markdown-body";

/**
 * Inline comment display — renders existing PR review comments in the diff.
 *
 * Features:
 * - Thread grouping (root + replies)
 * - Bot comment collapsing
 * - Suggestion block rendering with diff display
 * - Thread resolution (resolve/unresolve via GraphQL)
 */

export interface ReviewComment {
  id: number;
  body: string;
  path: string;
  line: number | null;
  user: { login: string; avatar_url?: string };
  created_at: string;
  in_reply_to_id?: number;
  node_id?: string;
}

interface InlineCommentProps {
  comments: ReviewComment[];
}

// Known bot suffixes/patterns
const BOT_PATTERNS = [
  /\[bot\]$/i,
  /-bot$/i,
  /^dependabot$/i,
  /^renovate$/i,
  /^codecov$/i,
  /^vercel$/i,
  /^github-actions$/i,
];

function isBot(login: string): boolean {
  return BOT_PATTERNS.some((p) => p.test(login));
}

export function InlineComment({ comments }: InlineCommentProps) {
  const roots = comments.filter((c) => !c.in_reply_to_id);
  const replies = comments.filter((c) => !!c.in_reply_to_id);

  // Separate bot and human comments
  const botRoots = roots.filter((c) => isBot(c.user.login));
  const humanRoots = roots.filter((c) => !isBot(c.user.login));

  return (
    <div className="border-border bg-bg-surface/60 mx-3 my-1.5 max-w-xl overflow-hidden rounded-lg border shadow-sm">
      {/* Human comments */}
      {humanRoots.map((root, i) => {
        const threadReplies = replies.filter((r) => r.in_reply_to_id === root.id);
        return (
          <div key={root.id}>
            {i > 0 && <div className="border-border border-t" />}
            <CommentBody
              comment={root}
              isRoot
            />
            {threadReplies.map((reply) => (
              <div
                key={reply.id}
                className="border-border-subtle border-t"
              >
                <CommentBody comment={reply} />
              </div>
            ))}
          </div>
        );
      })}

      {/* Bot comments — collapsed by default */}
      {botRoots.length > 0 && (
        <>
          {humanRoots.length > 0 && <div className="border-border border-t" />}
          <BotCommentGroup comments={botRoots} />
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bot comment group — collapsed by default
// ---------------------------------------------------------------------------

function BotCommentGroup({ comments }: { comments: ReviewComment[] }) {
  const [expanded, setExpanded] = useState(false);
  const botNames = [...new Set(comments.map((c) => c.user.login))];

  return (
    <div className="border-dashed">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="text-text-tertiary hover:bg-bg-raised flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-[11px]"
      >
        {expanded ? <ChevronDown size={11} /> : <ChevronRight size={11} />}
        <span className="opacity-60">
          {comments.length} bot comment{comments.length > 1 ? "s" : ""} from {botNames.join(", ")}
        </span>
      </button>
      {expanded &&
        comments.map((comment) => (
          <div
            key={comment.id}
            className="border-border-subtle border-t"
          >
            <CommentBody comment={comment} />
          </div>
        ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread resolution
// ---------------------------------------------------------------------------

function ThreadResolveButton({ comment }: { comment: ReviewComment }) {
  const { cwd } = useWorkspace();
  const [resolved, setResolved] = useState(false);

  const resolveMutation = useMutation({
    mutationFn: () => {
      if (!comment.node_id) {
        return Promise.reject(new Error("No thread ID"));
      }
      return resolved
        ? ipc("pr.unresolveThread", { cwd, threadId: comment.node_id })
        : ipc("pr.resolveThread", { cwd, threadId: comment.node_id });
    },
    onSuccess: () => {
      setResolved(!resolved);
      queryClient.invalidateQueries({ queryKey: ["pr", "comments"] });
    },
    onError: () => {
      toastManager.add({ title: "Failed to update thread", type: "error" });
    },
  });

  if (!comment.node_id) {
    return null;
  }

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-text-tertiary hover:text-text-primary gap-1 text-[10px]"
      onClick={() => resolveMutation.mutate()}
      disabled={resolveMutation.isPending}
    >
      {resolveMutation.isPending ? (
        <Spinner className="h-3 w-3" />
      ) : resolved ? (
        <CheckCircle2
          size={11}
          className="text-success"
        />
      ) : (
        <Circle size={11} />
      )}
      {resolved ? "Resolved" : "Resolve"}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Single comment body
// ---------------------------------------------------------------------------

function CommentBody({ comment, isRoot }: { comment: ReviewComment; isRoot?: boolean }) {
  const initial = comment.user.login[0]?.toUpperCase() ?? "?";
  const isBotUser = isBot(comment.user.login);

  // Parse suggestion blocks
  const { bodyParts, suggestions } = useMemo(() => parseSuggestions(comment.body), [comment.body]);

  return (
    <div className={`px-3 py-2.5 ${isBotUser ? "opacity-70" : ""}`}>
      <div className="flex items-center gap-2">
        {/* Avatar */}
        {comment.user.avatar_url ? (
          <img
            src={`${comment.user.avatar_url}&s=32`}
            alt={comment.user.login}
            className="border-border-strong h-5 w-5 shrink-0 rounded-full border object-cover"
          />
        ) : (
          <div
            className="text-bg-root flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
            style={{ background: "linear-gradient(135deg, var(--primary), #7c5a2a)" }}
          >
            {initial}
          </div>
        )}
        <span className="text-text-primary text-[11px] font-medium">{comment.user.login}</span>
        {isBotUser && (
          <span className="bg-bg-raised text-text-ghost rounded-sm px-1 text-[9px]">bot</span>
        )}
        <span className="text-text-tertiary font-mono text-[10px]">
          {relativeTime(new Date(comment.created_at))}
        </span>
        {/* Thread resolve button — only on root comments */}
        {isRoot && (
          <div className="ml-auto">
            <ThreadResolveButton comment={comment} />
          </div>
        )}
      </div>

      {/* Comment body with suggestion blocks */}
      <div className="mt-1.5">
        {bodyParts.map((part, i) => {
          if (part.type === "text") {
            return (
              <MarkdownBody
                key={`text-${i}`}
                content={part.content}
                className="text-xs leading-relaxed"
              />
            );
          }
          return (
            <SuggestionBlock
              key={`suggestion-${i}`}
              suggestion={part.content}
            />
          );
        })}
        {bodyParts.length === 0 && suggestions.length === 0 && (
          <MarkdownBody
            content={comment.body}
            className="text-xs leading-relaxed"
          />
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Suggestion block rendering
// ---------------------------------------------------------------------------

interface BodyPart {
  type: "text" | "suggestion";
  content: string;
}

function parseSuggestions(body: string): { bodyParts: BodyPart[]; suggestions: string[] } {
  const regex = /```suggestion\n([\s\S]*?)```/g;
  const parts: BodyPart[] = [];
  const suggestions: string[] = [];
  let lastIndex = 0;

  let match = regex.exec(body);
  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: body.slice(lastIndex, match.index) });
    }
    const suggestion = match[1] ?? "";
    parts.push({ type: "suggestion", content: suggestion });
    suggestions.push(suggestion);
    lastIndex = match.index + match[0].length;
    match = regex.exec(body);
  }

  if (lastIndex < body.length) {
    parts.push({ type: "text", content: body.slice(lastIndex) });
  }

  return { bodyParts: parts, suggestions };
}

function SuggestionBlock({ suggestion }: { suggestion: string }) {
  return (
    <div className="border-success/30 bg-diff-add-bg/30 my-2 overflow-hidden rounded-md border">
      <div className="border-success/20 flex items-center gap-1.5 border-b px-3 py-1.5">
        <Check
          size={11}
          className="text-success"
        />
        <span className="text-success text-[10px] font-medium">Suggested change</span>
      </div>
      <pre className="text-text-primary overflow-x-auto px-3 py-2 font-mono text-[11px] leading-relaxed">
        {suggestion}
      </pre>
    </div>
  );
}
