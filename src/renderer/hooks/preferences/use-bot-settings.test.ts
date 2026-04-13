import { describe, expect, it } from "vitest";

import { parseJsonArray } from "./use-bot-settings";

describe("parseJsonArray", () => {
  it("parses valid JSON array of strings", () => {
    expect(parseJsonArray('["a", "b", "c"]')).toEqual(["a", "b", "c"]);
  });

  it("filters out non-string values", () => {
    expect(parseJsonArray('[1, "valid", true, null]')).toEqual(["valid"]);
  });

  it("returns empty for null", () => {
    expect(parseJsonArray(null)).toEqual([]);
  });

  it("returns empty for undefined", () => {
    expect(parseJsonArray(undefined)).toEqual([]);
  });

  it("returns empty for empty string", () => {
    expect(parseJsonArray("")).toEqual([]);
  });

  it("returns empty for invalid JSON", () => {
    expect(parseJsonArray("not json")).toEqual([]);
  });

  it("returns empty for JSON object (non-array)", () => {
    expect(parseJsonArray('{"key": "val"}')).toEqual([]);
  });

  it("returns empty for JSON number", () => {
    expect(parseJsonArray("42")).toEqual([]);
  });
});
