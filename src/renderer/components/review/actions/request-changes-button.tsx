/* eslint-disable import/max-dependencies -- Review request dialogs intentionally compose dialog primitives, mutations, and the shared composer in one focused surface. */
import type { RepoTarget } from "@/shared/ipc";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { ReviewMarkdownComposer } from "@/renderer/components/review/comments/review-markdown-composer";
import { useReviewMutation } from "@/renderer/hooks/review/use-review-mutation";
import { MessageSquare } from "lucide-react";
import { useState } from "react";

/**
 * Request Changes button — opens a dialog to describe what needs to change.
 */

export function RequestChangesButton({
  repoTarget,
  prNumber,
}: {
  repoTarget: RepoTarget;
  prNumber: number;
}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState("");

  const reviewMutation = useReviewMutation({
    repoTarget,
    prNumber,
    successTitle: "Changes requested",
    onSuccess: () => {
      setBody("");
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setBody("");
        }
      }}
    >
      <DialogTrigger
        render={
          <Button
            size="xs"
            variant="ghost"
            className="text-destructive hover:bg-danger-muted hover:text-destructive gap-1.5"
          />
        }
      >
        <MessageSquare size={13} />
        Request Changes
      </DialogTrigger>
      <DialogPopup className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request changes</DialogTitle>
          <DialogDescription>
            Describe what needs to change before this can be merged.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-2">
          <ReviewMarkdownComposer
            autoFocus
            onChange={setBody}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey) && body.trim()) {
                event.preventDefault();
                reviewMutation.mutate({
                  event: "REQUEST_CHANGES",
                  body: body.trim(),
                });
              }
            }}
            placeholder="What needs to change?"
            prNumber={prNumber}
            rows={5}
            value={body}
          />
        </div>
        <DialogFooter variant="bare">
          <DialogClose render={<Button size="xs" variant="ghost" />}>Cancel</DialogClose>
          <Button
            size="xs"
            className="bg-destructive hover:bg-destructive/90 text-white"
            disabled={!body.trim() || reviewMutation.isPending}
            onClick={() => {
              reviewMutation.mutate({
                event: "REQUEST_CHANGES",
                body: body.trim(),
              });
            }}
          >
            {reviewMutation.isPending ? <Spinner className="h-3 w-3" /> : "Submit"}
          </Button>
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
