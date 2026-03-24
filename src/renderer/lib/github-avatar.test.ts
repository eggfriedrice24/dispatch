import { describe, expect, it } from "vitest";

import { buildGitHubAvatarUrl, resizeGitHubAvatarUrl } from "./github-avatar";

describe("buildGitHubAvatarUrl", () => {
  it("uses the repo host instead of hardcoding github.com", () => {
    expect(
      buildGitHubAvatarUrl({ login: "octocat", size: 48, host: "github.enterprise.test" }),
    ).toBe("https://github.enterprise.test/octocat.png?size=48");
  });

  it("normalizes bot logins to the corresponding profile png URL", () => {
    expect(buildGitHubAvatarUrl({ login: "dispatch-bot[bot]", size: 32 })).toBe(
      "https://github.com/dispatch-bot.png?size=32",
    );
  });
});

describe("resizeGitHubAvatarUrl", () => {
  it("updates avatar CDN urls with the s query param", () => {
    expect(resizeGitHubAvatarUrl("https://avatars.githubusercontent.com/u/9919?v=4", 64)).toBe(
      "https://avatars.githubusercontent.com/u/9919?v=4&s=64",
    );
  });

  it("updates hosted profile png urls with the size query param", () => {
    expect(resizeGitHubAvatarUrl("https://github.enterprise.test/octocat.png", 80)).toBe(
      "https://github.enterprise.test/octocat.png?size=80",
    );
  });

  it("preserves invalid urls instead of throwing", () => {
    expect(resizeGitHubAvatarUrl("not-a-url", 80)).toBe("not-a-url");
  });
});
