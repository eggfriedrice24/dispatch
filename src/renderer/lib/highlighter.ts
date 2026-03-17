import type { Highlighter } from "shiki";

import { createHighlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

/**
 * Lazily initialize a shared Shiki highlighter instance (WASM-based).
 * Called once, cached forever.
 */
export function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark-default"],
      langs: [
        "typescript",
        "javascript",
        "tsx",
        "jsx",
        "json",
        "yaml",
        "toml",
        "css",
        "html",
        "markdown",
        "python",
        "go",
        "rust",
        "java",
        "ruby",
        "shell",
        "sql",
        "dockerfile",
        "graphql",
        "swift",
        "kotlin",
        "c",
        "cpp",
      ],
    });
  }
  return highlighterPromise;
}

/**
 * Infer language from file path extension.
 */
export function inferLanguage(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    ts: "typescript",
    tsx: "tsx",
    js: "javascript",
    jsx: "jsx",
    json: "json",
    yml: "yaml",
    yaml: "yaml",
    toml: "toml",
    css: "css",
    html: "html",
    md: "markdown",
    py: "python",
    go: "go",
    rs: "rust",
    java: "java",
    rb: "ruby",
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    sql: "sql",
    dockerfile: "dockerfile",
    graphql: "graphql",
    gql: "graphql",
    swift: "swift",
    kt: "kotlin",
    c: "c",
    cpp: "cpp",
    h: "c",
  };
  return map[ext] ?? "text";
}
