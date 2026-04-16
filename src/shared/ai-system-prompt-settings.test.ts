import { describe, expect, it } from "vite-plus/test";

import {
  AI_SYSTEM_PROMPT_SETTINGS,
  buildAdditionalAiSystemPrompt,
  getAiSystemPromptPreferenceKey,
  normalizeAiSystemPrompt,
} from "./ai-system-prompt-settings";

describe("getAiSystemPromptPreferenceKey", () => {
  it("returns a saved preference key for supported AI workflows", () => {
    expect(getAiSystemPromptPreferenceKey("reviewSummary")).toBe("aiSystemPromptReviewSummary");
    expect(getAiSystemPromptPreferenceKey("triage")).toBe("aiSystemPromptTriage");
    expect(getAiSystemPromptPreferenceKey("commentSuggestions")).toBe(
      "aiSystemPromptCommentSuggestions",
    );
    expect(getAiSystemPromptPreferenceKey("commentRewrite")).toBe("aiSystemPromptCommentRewrite");
  });

  it("skips internal workflows that do not expose a user prompt override", () => {
    expect(getAiSystemPromptPreferenceKey("reviewConfidence")).toBeNull();
    expect(getAiSystemPromptPreferenceKey("codeExplanation")).toBeNull();
    expect(getAiSystemPromptPreferenceKey("failureExplanation")).toBeNull();
  });
});

describe("normalizeAiSystemPrompt", () => {
  it("returns null for blank values", () => {
    expect(normalizeAiSystemPrompt("   \n\t")).toBeNull();
    expect(normalizeAiSystemPrompt(null)).toBeNull();
  });

  it("trims surrounding whitespace while preserving prompt content", () => {
    expect(normalizeAiSystemPrompt("  Focus on rollout risk.  ")).toBe("Focus on rollout risk.");
  });
});

describe("buildAdditionalAiSystemPrompt", () => {
  it("wraps saved prompt text with guidance about Dispatch defaults", () => {
    expect(buildAdditionalAiSystemPrompt("Focus on migration risk.")).toBe(
      [
        "Additional user instructions for this Dispatch feature:",
        "Focus on migration risk.",
        "",
        "Treat these as supplemental guidance. Follow them when they do not conflict with earlier system instructions, required output formats, or the provided task context.",
      ].join("\n"),
    );
  });

  it("returns null when no additional prompt is configured", () => {
    expect(buildAdditionalAiSystemPrompt("   ")).toBeNull();
  });
});

describe("AI_SYSTEM_PROMPT_SETTINGS", () => {
  it("exposes the four settings-backed workflows called out in the AI settings UI", () => {
    expect(AI_SYSTEM_PROMPT_SETTINGS.map((definition) => definition.task)).toEqual([
      "reviewSummary",
      "triage",
      "commentSuggestions",
      "commentRewrite",
    ]);
  });
});
