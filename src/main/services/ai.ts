/**
 * AI provider adapter — raw fetch, no SDKs.
 *
 * Supports OpenAI, Anthropic, and Ollama (local).
 * Each provider returns differently; we normalize to a plain string.
 */

import type { AiProvider } from "../../shared/ipc";

import { getAiConfigWithSecrets } from "./ai-config";

interface AiMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiCompletionArgs {
  provider?: AiProvider;
  model?: string;
  apiKey?: string;
  baseUrl?: string;
  messages: AiMessage[];
  maxTokens?: number;
}

interface ResolvedAiCompletionArgs extends AiCompletionArgs {
  provider: AiProvider;
  model: string;
  apiKey: string;
}

export async function complete(args: AiCompletionArgs): Promise<string> {
  const config = getAiConfigWithSecrets({
    provider: args.provider,
    model: args.model,
    apiKey: args.apiKey,
    baseUrl: args.baseUrl,
  });

  if (!config.provider) {
    throw new Error(
      "AI provider is not configured. Set it in Settings or via Dispatch AI environment variables.",
    );
  }

  if (!config.model) {
    throw new Error(`AI model is not configured for ${config.provider}.`);
  }

  if (config.provider !== "ollama" && !config.apiKey) {
    throw new Error(
      `AI API key is not configured for ${config.provider}. Set it in Settings or the environment.`,
    );
  }

  const request: ResolvedAiCompletionArgs = {
    ...args,
    provider: config.provider,
    model: config.model,
    apiKey: config.apiKey,
    baseUrl: config.baseUrl ?? undefined,
  };

  switch (request.provider) {
    case "openai": {
      return completeOpenAI(request);
    }
    case "anthropic": {
      return completeAnthropic(request);
    }
    case "ollama": {
      return completeOllama(request);
    }
  }
}

async function completeOpenAI(args: ResolvedAiCompletionArgs): Promise<string> {
  const baseUrl = args.baseUrl || "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${args.apiKey}`,
    },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      max_completion_tokens: args.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    choices: Array<{ message: { content: string } }>;
  };
  return data.choices[0]?.message.content ?? "";
}

async function completeAnthropic(args: ResolvedAiCompletionArgs): Promise<string> {
  const baseUrl = args.baseUrl || "https://api.anthropic.com/v1";

  // Anthropic uses a system prompt separately from messages
  const systemMsg = args.messages.find((m) => m.role === "system");
  const otherMsgs = args.messages.filter((m) => m.role !== "system");

  const response = await fetch(`${baseUrl}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": args.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: args.model,
      system: systemMsg?.content,
      messages: otherMsgs.map((m) => ({ role: m.role, content: m.content })),
      max_tokens: args.maxTokens ?? 1024,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Anthropic API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text: string }>;
  };
  return data.content.find((c) => c.type === "text")?.text ?? "";
}

async function completeOllama(args: ResolvedAiCompletionArgs): Promise<string> {
  const baseUrl = args.baseUrl || "http://localhost:11434";
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: args.model,
      messages: args.messages,
      stream: false,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Ollama API error: ${response.status} ${text}`);
  }

  const data = (await response.json()) as {
    message: { content: string };
  };
  return data.message.content ?? "";
}
