import type { RepoTarget } from "@/shared/ipc";

import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/renderer/lib/app/error-message";
import { ipc } from "@/renderer/lib/app/ipc";
import { queryClient } from "@/renderer/lib/app/query-client";
import { useMutation } from "@tanstack/react-query";

export function useReviewMutation({
  repoTarget,
  prNumber,
  successTitle,
  errorTitle = "Review failed",
  onSuccess,
}: {
  repoTarget: RepoTarget;
  prNumber: number;
  successTitle: string;
  errorTitle?: string;
  onSuccess?: () => void;
}) {
  return useMutation({
    mutationFn: (args: { event: "APPROVE" | "REQUEST_CHANGES" | "COMMENT"; body?: string }) =>
      ipc("pr.submitReview", { ...repoTarget, prNumber, ...args }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr"] });
      toastManager.add({ title: successTitle, type: "success" });
      onSuccess?.();
    },
    onError: (err) => {
      toastManager.add({ title: errorTitle, description: getErrorMessage(err), type: "error" });
    },
  });
}
