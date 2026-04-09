import { ipc } from "@/renderer/lib/app/ipc";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

/**
 * Persisted minimized-comment state for a PR.
 * Returns a Set of minimized comment IDs and a toggle function
 * that optimistically updates the UI and persists via IPC.
 */
export function useMinimizedComments(repo: string, prNumber: number) {
  const queryClient = useQueryClient();
  const queryKey = ["minimizedComments", repo, prNumber];

  const { data: minimizedIds = [] } = useQuery({
    queryKey,
    queryFn: () => ipc("comment.getMinimized", { repo, prNumber }),
    staleTime: Infinity,
  });

  const minimizedSet = new Set(minimizedIds);

  const isCommentMinimized = useCallback(
    (commentId: string, autoMinimized = false) => {
      const hasExplicitOverride = minimizedSet.has(commentId);
      return autoMinimized ? !hasExplicitOverride : hasExplicitOverride;
    },
    [minimizedSet],
  );

  const toggleMinimized = useCallback(
    (commentId: string, autoMinimized = false) => {
      const isCurrentlyMinimized = isCommentMinimized(commentId, autoMinimized);
      const newMinimized = !isCurrentlyMinimized;

      const shouldPersistExplicitMinimized = autoMinimized ? !newMinimized : newMinimized;

      // Optimistic update
      queryClient.setQueryData<string[]>(queryKey, (old = []) =>
        shouldPersistExplicitMinimized
          ? old.includes(commentId)
            ? old
            : [...old, commentId]
          : old.filter((id) => id !== commentId),
      );

      // Persist
      ipc("comment.setMinimized", {
        repo,
        prNumber,
        commentId,
        minimized: shouldPersistExplicitMinimized,
      });
    },
    [isCommentMinimized, prNumber, queryClient, queryKey, repo],
  );

  return { isCommentMinimized, toggleMinimized };
}
