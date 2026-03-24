import { Badge } from "@/components/ui/badge";
import { relativeTime } from "@/shared/format";

import { AiReviewSummary } from "./ai-review-summary";
import { GitHubAvatar } from "./github-avatar";
import { MarkdownBody } from "./markdown-body";

/**
 * Overview tab — PR description, reviewers, AI summary.
 * No conversation or comments — those live in the Conversation tab.
 */

export function OverviewTab({
  pr,
  prNumber,
  repo,
  highlightedLogin,
  onReviewClick,
  diffSnippet,
}: {
  pr: {
    title: string;
    body: string;
    author: { login: string };
    reviewDecision: string;
    reviews: Array<{ author: { login: string }; state: string; submittedAt: string }>;
    files: Array<{ path: string; additions: number; deletions: number }>;
    updatedAt: string;
    url: string;
  };
  prNumber: number;
  repo: string;
  highlightedLogin: string | null;
  onReviewClick: (login: string) => void;
  diffSnippet: string;
}) {
  return (
    <div className="flex flex-col gap-0">
      {/* AI review summary */}
      <AiReviewSummary
        prNumber={prNumber}
        prTitle={pr.title}
        prBody={pr.body}
        author={pr.author.login}
        files={pr.files}
        diffSnippet={diffSnippet}
      />

      {/* PR description */}
      <div className="border-border border-b px-4 py-3">
        <div className="mb-2 flex items-center gap-2">
          <GitHubAvatar
            login={pr.author.login}
            size={18}
          />
          <span className="text-text-primary text-[11px] font-medium">{pr.author.login}</span>
          <span className="text-text-ghost text-[10px]">authored</span>
        </div>
        {pr.body ? (
          <MarkdownBody
            content={pr.body}
            repo={repo}
          />
        ) : (
          <p className="text-text-tertiary text-xs italic">No description provided.</p>
        )}
      </div>

      {/* Reviewers */}
      {pr.reviews.length > 0 && (
        <div className="border-border border-b px-4 py-3">
          <h3 className="text-text-tertiary mb-2 text-[10px] font-semibold tracking-[0.06em] uppercase">
            Reviewers
          </h3>
          <div className="flex flex-col gap-1.5">
            {dedupeReviews(pr.reviews).map((review) => {
              const isHighlighted = highlightedLogin === review.author.login;
              return (
                <button
                  key={review.author.login}
                  type="button"
                  onClick={() => onReviewClick(review.author.login)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-left transition-colors ${
                    isHighlighted ? "bg-primary/10 ring-primary/40 ring-1" : "hover:bg-bg-raised"
                  }`}
                >
                  <GitHubAvatar
                    login={review.author.login}
                    size={16}
                  />
                  <span className="text-text-primary text-[11px] font-medium">
                    {review.author.login}
                  </span>
                  <ReviewStateBadge state={review.state} />
                  <span className="text-text-ghost ml-auto font-mono text-[10px]">
                    {relativeTime(new Date(review.submittedAt))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function dedupeReviews(
  reviews: Array<{ author: { login: string }; state: string; submittedAt: string }>,
) {
  const latestByUser = new Map<
    string,
    { author: { login: string }; state: string; submittedAt: string }
  >();
  for (const review of reviews) {
    const existing = latestByUser.get(review.author.login);
    if (!existing || new Date(review.submittedAt) > new Date(existing.submittedAt)) {
      latestByUser.set(review.author.login, review);
    }
  }
  return [...latestByUser.values()];
}

function ReviewStateBadge({ state }: { state: string }) {
  const config =
    state === "APPROVED"
      ? { text: "Approved", color: "border-success/30 text-success" }
      : state === "CHANGES_REQUESTED"
        ? { text: "Changes Requested", color: "border-destructive/30 text-destructive" }
        : state === "COMMENTED"
          ? { text: "Commented", color: "border-border text-text-tertiary" }
          : state === "DISMISSED"
            ? { text: "Dismissed", color: "border-border text-text-ghost" }
            : state === "PENDING"
              ? { text: "Pending", color: "border-warning/30 text-warning" }
              : { text: state, color: "border-border text-text-tertiary" };

  return (
    <Badge
      variant="outline"
      className={`text-[9px] ${config.color}`}
    >
      {config.text}
    </Badge>
  );
}
