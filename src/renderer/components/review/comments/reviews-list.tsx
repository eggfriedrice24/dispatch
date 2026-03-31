import { Badge } from "@/components/ui/badge";
import { GitHubAvatar } from "@/renderer/components/shared/github-avatar";
import { relativeTime } from "@/shared/format";

/**
 * Reviews list — shows deduplicated reviewer states.
 */

export function ReviewsList({
  reviews,
  onReviewClick,
}: {
  reviews: Array<{ author: { login: string }; state: string; submittedAt: string }>;
  onReviewClick: (login: string) => void;
}) {
  if (reviews.length === 0) {
    return <div className="text-text-tertiary px-3 py-4 text-center text-xs">No reviews yet</div>;
  }

  // Dedupe: show only the most recent review per user
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
  const uniqueReviews = [...latestByUser.values()];

  return (
    <div className="flex flex-col gap-1 p-2">
      {uniqueReviews.map((review) => (
        <button
          key={review.author.login}
          type="button"
          onClick={() => onReviewClick(review.author.login)}
          className="hover:bg-bg-raised flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors"
        >
          <GitHubAvatar
            login={review.author.login}
            size={20}
          />
          <div className="min-w-0 flex-1">
            <span className="text-text-primary text-xs font-medium">{review.author.login}</span>
            <span className="text-text-ghost ml-1.5 font-mono text-[10px]">
              {relativeTime(new Date(review.submittedAt))}
            </span>
          </div>
          <ReviewStateBadge state={review.state} />
        </button>
      ))}
    </div>
  );
}

export function ReviewStateBadge({ state }: { state: string }) {
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
