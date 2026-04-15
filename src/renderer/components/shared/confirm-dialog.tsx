import type React from "react";

import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  trigger: React.ReactElement;
  title: string;
  description: string;
  confirmLabel: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
}

/**
 * Generic confirmation dialog that wraps a trigger element.
 * Opens an AlertDialog with a title, description, and confirm/cancel buttons.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  confirmVariant = "destructive",
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger render={trigger} />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogClose
            render={
              <Button
                variant="outline"
                size="xs"
              />
            }
          >
            Cancel
          </AlertDialogClose>
          <AlertDialogClose
            render={
              <Button
                variant={confirmVariant}
                size="xs"
                onClick={onConfirm}
              />
            }
          >
            {confirmLabel}
          </AlertDialogClose>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
