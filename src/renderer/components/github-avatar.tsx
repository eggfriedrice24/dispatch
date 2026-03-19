/**
 * GitHub avatar component.
 *
 * Uses the predictable `https://github.com/{login}.png` URL pattern
 * which GitHub redirects to the avatar CDN. No API call needed.
 */

interface GitHubAvatarProps {
  login: string;
  size?: number;
  className?: string;
}

/** Get a GitHub avatar URL for a given username */
export function githubAvatarUrl(login: string, size = 64): string {
  // Strip [bot] suffix for avatar URL
  const cleanLogin = login.replace(/\[bot\]$/i, "");
  return `https://github.com/${encodeURIComponent(cleanLogin)}.png?size=${size}`;
}

export function GitHubAvatar({ login, size = 20, className = "" }: GitHubAvatarProps) {
  return (
    <img
      src={githubAvatarUrl(login, size * 2)}
      alt={login}
      width={size}
      height={size}
      className={`bg-bg-raised shrink-0 rounded-full ${className}`}
      loading="eager"
      onError={(e) => {
        // Fallback to a gradient avatar on load failure
        const target = e.currentTarget;
        target.style.display = "none";
        const fallback = document.createElement("div");
        fallback.className = `shrink-0 rounded-full flex items-center justify-center text-bg-root font-semibold ${className}`;
        fallback.style.width = `${size}px`;
        fallback.style.height = `${size}px`;
        fallback.style.fontSize = `${Math.max(size * 0.4, 8)}px`;
        fallback.style.background = "linear-gradient(135deg, var(--primary), #7c5a2a)";
        fallback.textContent = login[0]?.toUpperCase() ?? "?";
        target.parentNode?.insertBefore(fallback, target);
      }}
    />
  );
}
