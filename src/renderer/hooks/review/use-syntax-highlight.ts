import type { Highlighter } from "shiki";

import { getHighlighter } from "@/renderer/lib/review/highlighter";
import { useEffect, useState } from "react";

/**
 * React hook that asynchronously loads the Shiki highlighter.
 * Returns null while loading — components should fall back to plain text.
 */
export function useSyntaxHighlighter(): Highlighter | null {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((h) => {
        if (!cancelled) {
          setHighlighter(h);
        }
      })
      .catch(() => {
        // Highlighter failed to load — fall back to plain text rendering.
        // GetHighlighter() resets its cache on failure, so a re-mount will retry.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return highlighter;
}
