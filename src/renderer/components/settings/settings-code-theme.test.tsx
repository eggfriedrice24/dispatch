import { describe, expect, it } from "vite-plus/test";

import { getThemeOptions } from "./settings-code-theme";

describe("getThemeOptions", () => {
  it("includes the oled theme when the experiment is enabled", () => {
    expect(getThemeOptions(true).map((option) => option.value)).toEqual([
      "dark",
      "oled",
      "light",
      "system",
    ]);
  });

  it("keeps the default theme list when the experiment is disabled", () => {
    expect(getThemeOptions(false).map((option) => option.value)).toEqual([
      "dark",
      "light",
      "system",
    ]);
  });

  it("includes neo-brutalism themes when the experiment is enabled", () => {
    expect(getThemeOptions(false, true).map((option) => option.value)).toEqual([
      "dark",
      "light",
      "neo-brutal-dark",
      "neo-brutal-light",
      "neo-brutal-oled",
      "system",
    ]);
  });

  it("includes both oled and neo-brutalism when both are enabled", () => {
    expect(getThemeOptions(true, true).map((option) => option.value)).toEqual([
      "dark",
      "oled",
      "light",
      "neo-brutal-dark",
      "neo-brutal-light",
      "neo-brutal-oled",
      "system",
    ]);
  });
});
