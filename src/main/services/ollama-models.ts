interface OllamaTagsResponse {
  models?: Array<{
    name?: unknown;
    model?: unknown;
  }>;
}

let cachedModels: string[] | null = null;

function normalizeModelName(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function parseOllamaTagsOutput(output: string): string[] {
  if (output.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(output) as OllamaTagsResponse;
    if (!Array.isArray(parsed.models)) {
      return [];
    }

    const models: string[] = [];

    for (const entry of parsed.models) {
      const normalizedModel = normalizeModelName(entry?.name) ?? normalizeModelName(entry?.model);

      if (normalizedModel && !models.includes(normalizedModel)) {
        models.push(normalizedModel);
      }
    }

    return models;
  } catch {
    return [];
  }
}

export function cacheOllamaSuggestedModels(models: string[]): string[] {
  cachedModels = [...models];
  return cachedModels;
}

export function resolveOllamaSuggestedModels(): string[] {
  return cachedModels ?? [];
}
