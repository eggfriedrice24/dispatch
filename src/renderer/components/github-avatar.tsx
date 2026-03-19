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
  return `https://github.com/${encodeURIComponent(login)}.png?size=${size}`;
}

export function GitHubAvatar({ login, size = 20, className = "" }: GitHubAvatarProps) {
  return (
    <img
      src={githubAvatarUrl(login, size * 2)}
      alt={login}
      width={size}
      height={size}
      className={`shrink-0 rounded-full ${className}`}
      loading="eager"
    />
  );
}
