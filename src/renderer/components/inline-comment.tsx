import { relativeTime } from "@/shared/format";

/**
 * Inline comment display — renders existing PR review comments in the diff.
 *
 * - Background: --bg-raised, Border: 1px solid --border
 * - Left border: 2px solid --accent
 * - Padding: 8px 12px, aligned with code column (68px left margin)
 */

export interface ReviewComment {
  id: number;
  body: string;
  path: string;
  line: number | null;
  user: { login: string };
  created_at: string;
  in_reply_to_id?: number;
}

interface InlineCommentProps {
  comments: ReviewComment[];
}

export function InlineComment({ comments }: InlineCommentProps) {
  // Group into threads: find root comments and their replies
  const roots = comments.filter((c) => !c.in_reply_to_id);
  const replies = comments.filter((c) => !!c.in_reply_to_id);

  return (
    <div className="border-border border-l-primary bg-bg-raised my-1 mr-3 ml-[68px] rounded-md border border-l-2">
      {roots.map((root) => {
        const threadReplies = replies.filter((r) => r.in_reply_to_id === root.id);
        return (
          <div key={root.id}>
            <CommentBody comment={root} />
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
    </div>
  );
}

function CommentBody({ comment }: { comment: ReviewComment }) {
  return (
    <div className="px-3 py-2">
      <div className="flex items-center gap-2">
        {/* Avatar */}
        <div
          className="text-bg-root flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-semibold"
          style={{ background: "linear-gradient(135deg, var(--primary), #7c5a2a)" }}
        >
          {comment.user.login[0]?.toUpperCase() ?? "?"}
        </div>
        <span className="text-text-primary text-[11px] font-medium">{comment.user.login}</span>
        <span className="text-text-tertiary font-mono text-[10px]">
          {relativeTime(new Date(comment.created_at))}
        </span>
      </div>
      <p className="text-text-secondary mt-1 text-xs leading-relaxed whitespace-pre-wrap">
        {comment.body}
      </p>
    </div>
  );
}
