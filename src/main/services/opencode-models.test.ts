import { describe, expect, it } from "vite-plus/test";

import { parseOpencodeModelsOutput } from "./opencode-models";

describe("parseOpencodeModelsOutput", () => {
  it("parses one model per line", () => {
    const output = [
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-opus-4-20250115",
      "openai/gpt-5.4",
    ].join("\n");

    expect(parseOpencodeModelsOutput(output)).toEqual([
      "anthropic/claude-sonnet-4-20250514",
      "anthropic/claude-opus-4-20250115",
      "openai/gpt-5.4",
    ]);
  });

  it("ignores blank lines and whitespace", () => {
    const output = "\n  anthropic/claude-sonnet-4-20250514  \n\n  openai/gpt-5.4\n\n";

    expect(parseOpencodeModelsOutput(output)).toEqual([
      "anthropic/claude-sonnet-4-20250514",
      "openai/gpt-5.4",
    ]);
  });

  it("returns an empty array for empty output", () => {
    expect(parseOpencodeModelsOutput("")).toEqual([]);
    expect(parseOpencodeModelsOutput("   \n  \n  ")).toEqual([]);
  });

  it("handles a single model", () => {
    expect(parseOpencodeModelsOutput("github-copilot/claude-sonnet-4.6")).toEqual([
      "github-copilot/claude-sonnet-4.6",
    ]);
  });

  it("preserves provider prefixes in model IDs", () => {
    const output = [
      "genaistudio/aipe-bedrock-claude-4-sonnet",
      "github-copilot/gpt-5.4",
      "anthropic/claude-opus-4-20250115",
    ].join("\n");

    expect(parseOpencodeModelsOutput(output)).toEqual([
      "genaistudio/aipe-bedrock-claude-4-sonnet",
      "github-copilot/gpt-5.4",
      "anthropic/claude-opus-4-20250115",
    ]);
  });
});
