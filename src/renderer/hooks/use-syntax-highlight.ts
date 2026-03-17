import type { Highlighter } from "shiki";

import { useEffect, useState } from "react";

import { getHighlighter } from "../lib/highlighter";

/**
 * React hook that asynchronously loads the Shiki highlighter.
 * Returns null while loading — components should fall back to plain text.
 */
export function useSyntaxHighlighter(): Highlighter | null {
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    getHighlighter().then((h) => {
      if (!cancelled) {
        setHighlighter(h);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return highlighter;
}
