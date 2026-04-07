import { getAiProviderStatusConfig } from "./ai-config";
import { execFile, resolveExecutablePath } from "./shell";

const OPENCODE_MODELS_TIMEOUT_MS = 10_000;

let cachedModels: string[] | null = null;

/**
 * Parse the output of `opencode models` into a list of model IDs.
 * The command outputs one model per line.
 */
export function parseOpencodeModelsOutput(output: string): string[] {
  const models: string[] = [];

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.length > 0) {
      models.push(trimmed);
    }
  }

  return models;
}

/**
 * Run `opencode models` and return the list of available model IDs.
 * Results are cached in memory; call {@link refreshOpencodeModelsCache}
 * to force a refresh (e.g. during provider status probing).
 */
export async function fetchOpencodeModels(binaryPath?: string | null): Promise<string[]> {
  const command = binaryPath?.trim() || "opencode";
  const resolvedCommand =
    command.includes("/") || command.includes("\\")
      ? command
      : (resolveExecutablePath(command) ?? null);

  if (!resolvedCommand) {
    return [];
  }

  try {
    const result = await execFile(resolvedCommand, ["models"], {
      timeout: OPENCODE_MODELS_TIMEOUT_MS,
    });

    return parseOpencodeModelsOutput(result.stdout);
  } catch {
    return [];
  }
}

/**
 * Refresh the in-memory cache of OpenCode models by running the CLI.
 * Called during provider status probing so the result is ready for
 * synchronous reads by {@link resolveOpencodeSuggestedModels}.
 */
export async function refreshOpencodeModelsCache(): Promise<string[]> {
  const { binaryPath } = getAiProviderStatusConfig("opencode");
  const models = await fetchOpencodeModels(binaryPath);
  cachedModels = models;
  return models;
}

/**
 * Return the cached OpenCode models list synchronously.
 * Returns an empty array if the cache has not been populated yet.
 */
export function resolveOpencodeSuggestedModels(): string[] {
  return cachedModels ?? [];
}
