function normalizeGitHubLogin(login: string): string {
  return login.replace(/\[bot\]$/i, "");
}

function normalizeGitHubHost(host: string): string {
  const trimmed = host
    .trim()
    .replace(/^https?:\/\//u, "")
    .replace(/\/+$/u, "");
  return trimmed || "github.com";
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
