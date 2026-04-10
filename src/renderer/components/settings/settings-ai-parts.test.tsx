import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { AiProviderRow } from "./settings-ai-parts";

function TestAiProviderRow() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <AiProviderRow
      label="Codex"
      version="v1.0.0"
      statusText="Configured and ready"
      dotClass="bg-success"
      isExpanded={isExpanded}
      hasDivider={false}
      badges={["Big"]}
      onToggleExpanded={() => setIsExpanded((current) => !current)}
    >
      <div>Provider details</div>
    </AiProviderRow>
  );
}

describe("AiProviderRow", () => {
  it("toggles when clicking anywhere in the provider header", async () => {
    const user = userEvent.setup();
    render(<TestAiProviderRow />);

    const toggleButton = screen.getByRole("button", { name: "Toggle Codex settings" });

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");

    await user.click(screen.getByText("Codex"));

    expect(toggleButton).toHaveAttribute("aria-expanded", "true");

    await user.click(screen.getByText("Configured and ready"));

    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
  });
});
