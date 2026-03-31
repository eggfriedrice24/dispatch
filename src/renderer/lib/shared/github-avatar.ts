function normalizeGitHubLogin(login: string): string {
  return login.replace(/\[bot\]$/i, "");
}

const ENTERPRISE_MANAGED_USER_LOGIN_PATTERN = /^[a-z0-9][a-z0-9-]*_[a-z0-9]{3,8}$/iu;

function normalizeGitHubHost(host: string): string {
  const trimmed = host
    .trim()
    .replace(/^https?:\/\//u, "")
    .replace(/\/+$/u, "");
  return trimmed || "github.com";
}

export function isEnterpriseManagedUserLogin(login: string): boolean {
  return ENTERPRISE_MANAGED_USER_LOGIN_PATTERN.test(normalizeGitHubLogin(login));
}

export function buildGitHubAvatarUrl({
  login,
  size = 64,
  host = "github.com",
}: {
  login: string;
  size?: number;
  host?: string;
}): string {
  const url = new URL(
    `https://${normalizeGitHubHost(host)}/${encodeURIComponent(normalizeGitHubLogin(login))}.png`,
  );
  url.searchParams.set("size", String(size));
  return url.toString();
}

export function resizeGitHubAvatarUrl(avatarUrl: string, size: number): string {
  try {
    const url = new URL(avatarUrl);
    const sizeParam = url.pathname.endsWith(".png") ? "size" : "s";
    url.searchParams.delete("s");
    url.searchParams.delete("size");
    url.searchParams.set(sizeParam, String(size));
    return url.toString();
  } catch {
    return avatarUrl;
  }
}

export function getGitHubAvatarUrl({
  login,
  size = 64,
  host = "github.com",
  avatarUrl,
  resolvedAvatarUrl,
}: {
  login: string;
  size?: number;
  host?: string;
  avatarUrl?: string;
  resolvedAvatarUrl?: string | null;
}): string {
  const preferredAvatarUrl = resolvedAvatarUrl ?? avatarUrl;

  if (preferredAvatarUrl) {
    return resizeGitHubAvatarUrl(preferredAvatarUrl, size);
  }

  return buildGitHubAvatarUrl({ login, size, host });
}
