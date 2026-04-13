import { describe, expect, it } from "vitest";

import { formatAuthorName } from "./use-display-name";

describe("formatAuthorName", () => {
  it("returns real name when format is 'name' and name exists", () => {
    expect(formatAuthorName({ login: "octocat", name: "Mona Lisa" }, "name")).toBe("Mona Lisa");
  });

  it("falls back to login when format is 'name' but name is null", () => {
    expect(formatAuthorName({ login: "octocat", name: null }, "name")).toBe("octocat");
  });

  it("falls back to login when format is 'name' but name is undefined", () => {
    expect(formatAuthorName({ login: "octocat" }, "name")).toBe("octocat");
  });

  it("returns login when format is 'login' regardless of name", () => {
    expect(formatAuthorName({ login: "octocat", name: "Mona Lisa" }, "login")).toBe("octocat");
  });

  it("returns login when format is 'login' and name is null", () => {
    expect(formatAuthorName({ login: "octocat", name: null }, "login")).toBe("octocat");
  });
});
