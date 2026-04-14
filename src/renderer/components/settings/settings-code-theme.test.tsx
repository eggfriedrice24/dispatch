import { describe, expect, it } from "vite-plus/test";

import { getColorModeOptions, getThemeStyleOptions } from "./settings-code-theme";

describe("getThemeStyleOptions", () => {
  it("returns only default when neo-brutalism is disabled", () => {
    expect(getThemeStyleOptions(false).map((o) => o.value)).toEqual(["default"]);
  });

  it("includes neo-brutalism when enabled", () => {
    expect(getThemeStyleOptions(true).map((o) => o.value)).toEqual(["default", "neo-brutalism"]);
  });
});

describe("getColorModeOptions", () => {
  it("returns dark, light, system when oled is disabled", () => {
    expect(getColorModeOptions(false).map((o) => o.value)).toEqual(["dark", "light", "system"]);
  });

  it("inserts oled after dark when enabled", () => {
    expect(getColorModeOptions(true).map((o) => o.value)).toEqual([
      "dark",
      "oled",
      "light",
      "system",
    ]);
  });
});
