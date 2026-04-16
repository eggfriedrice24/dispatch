import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vite-plus/test";

import { AiSystemPromptsSection } from "./settings-ai-prompts";

describe("AiSystemPromptsSection", () => {
  it("saves edited prompt text when the field loses focus", async () => {
    const user = userEvent.setup();
    const savePref = vi.fn();

    render(
      <AiSystemPromptsSection
        prefs={{}}
        savePref={savePref}
      />,
    );

    const promptField = screen.getByLabelText("Pull request summary additional system prompt");

    await user.click(promptField);
    await user.type(promptField, "Focus on reviewer risk.");
    await user.tab();

    expect(savePref).toHaveBeenCalledWith("aiSystemPromptReviewSummary", "Focus on reviewer risk.");
  });

  it("clears the saved preference when the prompt is emptied out", async () => {
    const user = userEvent.setup();
    const savePref = vi.fn();

    render(
      <AiSystemPromptsSection
        prefs={{ aiSystemPromptCommentRewrite: "Keep comments gentle." }}
        savePref={savePref}
      />,
    );

    const promptField = screen.getByLabelText("Text rewrite additional system prompt");

    await user.clear(promptField);
    await user.tab();

    expect(savePref).toHaveBeenCalledWith("aiSystemPromptCommentRewrite", "");
  });
});
