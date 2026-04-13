import type { RepoTarget } from "@/shared/ipc";

import { Spinner } from "@/components/ui/spinner";
import { toastManager } from "@/components/ui/toast";
import { getErrorMessage } from "@/renderer/lib/app/error-message";
import { ipc } from "@/renderer/lib/app/ipc";
import { queryClient } from "@/renderer/lib/app/query-client";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";

import { btnBase } from "./floating-review-bar";

export function UpdateBranchPill({
  repoTarget,
  prNumber,
  compact,
  dense,
}: {
  repoTarget: RepoTarget;
  prNumber: number;
  compact: boolean;
  dense: boolean;
}) {
  const updateMutation = useMutation({
    mutationFn: () => ipc("pr.updateBranch", { ...repoTarget, prNumber }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pr"] });
      toastManager.add({ title: "Branch updated", type: "success" });
    },
    onError: (err) => {
      toastManager.add({
        title: "Update failed",
        description: getErrorMessage(err),
        type: "error",
      });
    },
  });

  return (
    <button
      type="button"
      onClick={() => updateMutation.mutate()}
      disabled={updateMutation.isPending}
      title={dense ? "Update branch" : undefined}
      aria-label="Update branch"
      style={{
        ...btnBase,
        background: "transparent",
        color: "var(--warning)",
        borderColor: "var(--border)",
        fontSize: "10px",
        padding: dense ? "2px 6px" : "2px 7px",
        gap: "3px",
        opacity: updateMutation.isPending ? 0.5 : 1,
      }}
    >
      {updateMutation.isPending ? <Spinner className="h-2.5 w-2.5" /> : <RefreshCw size={9} />}
      {!dense && (compact ? "Update" : "Update branch")}
    </button>
  );
}
