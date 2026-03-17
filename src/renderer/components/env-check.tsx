import { AlertTriangle, Terminal } from "lucide-react";

/**
 * Environment check error screen (SPEC.md § 4.3).
 *
 * Shown when `gh` or `git` is not installed, or `gh` is not authenticated.
 * Prompts the user to install or authenticate in their terminal.
 */

interface EnvCheckProps {
  ghVersion: string | null;
  gitVersion: string | null;
  ghAuth: boolean;
}

export function EnvCheck({ ghVersion, gitVersion, ghAuth }: EnvCheckProps) {
  const issues: Array<{ title: string; description: string; command: string }> = [];

  if (!gitVersion) {
    issues.push({
      title: "Git not found",
      description: "Dispatch requires Git to be installed on your system.",
      command: "brew install git",
    });
  }

  if (!ghVersion) {
    issues.push({
      title: "GitHub CLI not found",
      description: "Dispatch requires the GitHub CLI (gh) for fetching PRs, checks, and merging.",
      command: "brew install gh",
    });
  } else if (!ghAuth) {
    issues.push({
      title: "GitHub CLI not authenticated",
      description: "You need to authenticate the GitHub CLI before Dispatch can access your repositories.",
      command: "gh auth login",
    });
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center gap-8 bg-bg-root px-8">
      {/* Display heading (§ 10.5 Empty states) */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-warning-muted">
          <AlertTriangle size={24} className="text-warning" />
        </div>
        <h1 className="font-heading text-4xl italic text-text-primary">
          Almost there
        </h1>
        <p className="max-w-md text-center text-[13px] leading-relaxed text-text-secondary">
          Dispatch needs a few tools to be set up on your machine before it can connect to GitHub.
        </p>
      </div>

      {/* Issue cards */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        {issues.map((issue) => (
          <div
            key={issue.title}
            className="rounded-lg border border-border bg-bg-raised p-4"
          >
            <h3 className="text-[13px] font-semibold text-text-primary">
              {issue.title}
            </h3>
            <p className="mt-1 text-xs text-text-secondary">
              {issue.description}
            </p>
            <div className="mt-3 flex items-center gap-2 rounded-md border border-border bg-bg-root px-3 py-2">
              <Terminal size={12} className="shrink-0 text-text-tertiary" />
              <code className="font-mono text-xs text-accent-text">
                {issue.command}
              </code>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[11px] text-text-tertiary">
        Run the commands above in your terminal, then restart Dispatch.
      </p>
    </div>
  );
}
