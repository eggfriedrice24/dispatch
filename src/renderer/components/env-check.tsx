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
      description:
        "You need to authenticate the GitHub CLI before Dispatch can access your repositories.",
      command: "gh auth login",
    });
  }

  if (issues.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-root flex h-screen flex-col items-center justify-center gap-8 px-8">
      {/* Display heading (§ 10.5 Empty states) */}
      <div className="flex flex-col items-center gap-3">
        <div className="bg-warning-muted flex h-12 w-12 items-center justify-center rounded-lg">
          <AlertTriangle
            size={24}
            className="text-warning"
          />
        </div>
        <h1 className="font-heading text-text-primary text-4xl italic">Almost there</h1>
        <p className="text-text-secondary max-w-md text-center text-[13px] leading-relaxed">
          Dispatch needs a few tools to be set up on your machine before it can connect to GitHub.
        </p>
      </div>

      {/* Issue cards */}
      <div className="flex w-full max-w-lg flex-col gap-3">
        {issues.map((issue) => (
          <div
            key={issue.title}
            className="border-border bg-bg-raised rounded-lg border p-4"
          >
            <h3 className="text-text-primary text-[13px] font-semibold">{issue.title}</h3>
            <p className="text-text-secondary mt-1 text-xs">{issue.description}</p>
            <div className="border-border bg-bg-root mt-3 flex items-center gap-2 rounded-md border px-3 py-2">
              <Terminal
                size={12}
                className="text-text-tertiary shrink-0"
              />
              <code className="text-accent-text font-mono text-xs">{issue.command}</code>
            </div>
          </div>
        ))}
      </div>

      <p className="text-text-tertiary text-[11px]">
        Run the commands above in your terminal, then restart Dispatch.
      </p>
    </div>
  );
}
