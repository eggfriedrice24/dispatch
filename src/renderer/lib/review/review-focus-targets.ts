export const REVIEW_FOCUS_TARGET_ATTRIBUTE = "data-review-focus-target";
export const REVIEW_DIFF_SEARCH_EVENT = "dispatch:review-diff-search";

export type ReviewFocusTarget =
  | "file-search"
  | "file-tree"
  | "diff-search"
  | "diff-viewer"
  | "panel-search"
  | "panel-tabs"
  | "panel-overview"
  | "panel-conversation"
  | "panel-commits"
  | "panel-checks"
  | "review-actions";

interface FocusReviewTargetOptions {
  preferDescendant?: boolean;
  selectText?: boolean;
}

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "[href]",
  "input:not([disabled])",
  "textarea:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

function getTargetSelector(target: ReviewFocusTarget): string {
  return `[${REVIEW_FOCUS_TARGET_ATTRIBUTE}="${target}"]`;
}

export function getActiveReviewFocusTarget(): ReviewFocusTarget | null {
  const { activeElement } = document;
  if (!(activeElement instanceof HTMLElement)) {
    return null;
  }

  const owner = activeElement.closest<HTMLElement>(`[${REVIEW_FOCUS_TARGET_ATTRIBUTE}]`);
  const value = owner?.dataset.reviewFocusTarget;
  return value ? (value as ReviewFocusTarget) : null;
}

export function focusReviewTarget(
  target: ReviewFocusTarget,
  { preferDescendant = false, selectText = false }: FocusReviewTargetOptions = {},
): boolean {
  const root = document.querySelector<HTMLElement>(getTargetSelector(target));
  if (!root) {
    return false;
  }

  const nextFocus = preferDescendant
    ? (root.querySelector<HTMLElement>(FOCUSABLE_SELECTOR) ?? root)
    : root;
  nextFocus.focus({ preventScroll: true });

  if (
    selectText &&
    (nextFocus instanceof HTMLInputElement || nextFocus instanceof HTMLTextAreaElement)
  ) {
    nextFocus.select();
  }

  return true;
}

export function focusReviewTargetSoon(
  target: ReviewFocusTarget,
  options?: FocusReviewTargetOptions,
): void {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      focusReviewTarget(target, options);
    });
  });
}

export function requestReviewDiffSearchFocus(): void {
  globalThis.dispatchEvent(new Event(REVIEW_DIFF_SEARCH_EVENT));
}
