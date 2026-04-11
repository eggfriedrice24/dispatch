import { describe, expect, it } from "vite-plus/test";

import { parseOllamaTagsOutput } from "./ollama-models";

describe("parseOllamaTagsOutput", () => {
  it("extracts installed model names from the tags response", () => {
    const output = JSON.stringify({
      models: [{ name: "qwen2.5-coder:14b" }, { name: "llama3.2:latest" }],
    });

    expect(parseOllamaTagsOutput(output)).toEqual(["qwen2.5-coder:14b", "llama3.2:latest"]);
  });

  it("falls back to the model field and removes duplicates", () => {
    const output = JSON.stringify({
      models: [
        { model: "deepseek-r1:8b" },
        { name: "deepseek-r1:8b" },
        { name: "  llama3.1:latest  " },
      ],
    });

    expect(parseOllamaTagsOutput(output)).toEqual(["deepseek-r1:8b", "llama3.1:latest"]);
  });

  it("returns an empty array for invalid payloads", () => {
    expect(parseOllamaTagsOutput("")).toEqual([]);
    expect(parseOllamaTagsOutput("{}")).toEqual([]);
    expect(parseOllamaTagsOutput("not-json")).toEqual([]);
  });
});
