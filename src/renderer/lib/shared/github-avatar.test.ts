import {
  buildGitHubAvatarUrl,
  getGitHubAvatarUrl,
  isEnterpriseManagedUserLogin,
  resizeGitHubAvatarUrl,
} from "@/renderer/lib/shared/github-avatar";
import { describe, expect, it } from "vitest";

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

describe("isEnterpriseManagedUserLogin", () => {
  it("detects enterprise managed usernames on github.com", () => {
    expect(isEnterpriseManagedUserLogin("mona-cat_octo")).toBeTruthy();
  });

  it("ignores standard GitHub usernames", () => {
    expect(isEnterpriseManagedUserLogin("octocat")).toBeFalsy();
  });
});

describe("getGitHubAvatarUrl", () => {
  it("prefers a resolved API avatar url over the login png fallback", () => {
    expect(
      getGitHubAvatarUrl({
        login: "mona-cat_octo",
        size: 72,
        avatarUrl: "https://avatars.githubusercontent.com/u/123?v=4",
        resolvedAvatarUrl: "https://avatars.githubusercontent.com/u/456?v=4",
      }),
    ).toBe("https://avatars.githubusercontent.com/u/456?v=4&s=72");
  });

  it("falls back to the profile png url when no resolved avatar exists", () => {
    expect(
      getGitHubAvatarUrl({
        login: "octocat",
        size: 40,
        host: "github.com",
      }),
    ).toBe("https://github.com/octocat.png?size=40");
  });
});
