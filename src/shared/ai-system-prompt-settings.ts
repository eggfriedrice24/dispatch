import type { AiTaskId } from "./ipc";

export interface AiSystemPromptSettingDefinition {
  task: AiTaskId;
  preferenceKey: string;
  label: string;
  description: string;
  placeholder: string;
}

export const AI_SYSTEM_PROMPT_PREFERENCE_KEYS = [
  "aiSystemPromptReviewSummary",
  "aiSystemPromptTriage",
  "aiSystemPromptCommentSuggestions",
  "aiSystemPromptCommentRewrite",
] as const;

type AiSystemPromptPreferenceKey = (typeof AI_SYSTEM_PROMPT_PREFERENCE_KEYS)[number];

const AI_TASK_SYSTEM_PROMPT_PREFERENCE_KEYS: Partial<
  Record<AiTaskId, AiSystemPromptPreferenceKey>
> = {
  reviewSummary: "aiSystemPromptReviewSummary",
  triage: "aiSystemPromptTriage",
  commentSuggestions: "aiSystemPromptCommentSuggestions",
  commentRewrite: "aiSystemPromptCommentRewrite",
};

export const AI_SYSTEM_PROMPT_SETTINGS = [
  {
    task: "reviewSummary",
    preferenceKey: "aiSystemPromptReviewSummary",
    label: "Pull request summary",
    description: "Extra instructions for the AI summary shown in the overview and sidebar.",
    placeholder:
      "Example: Call out migration risk first, then the one or two files a reviewer should inspect closely.",
  },
  {
    task: "triage",
    preferenceKey: "aiSystemPromptTriage",
    label: "Triage",
    description: "Extra instructions for how Dispatch groups changed files into review sections.",
    placeholder:
      "Example: Keep related UI components and their colocated tests together when they represent one surface change.",
  },
  {
    task: "commentSuggestions",
    preferenceKey: "aiSystemPromptCommentSuggestions",
    label: "Code review",
    description:
      "Extra instructions for inline AI review comments while you inspect changed files.",
    placeholder:
      "Example: Prioritize security, data loss, migration, and operability issues over style-only feedback.",
  },
  {
    task: "commentRewrite",
    preferenceKey: "aiSystemPromptCommentRewrite",
    label: "Text rewrite",
    description: "Extra instructions for rewriting selected review-comment text or replies.",
    placeholder:
      "Example: Keep rewrites crisp and collaborative, but make the request more direct when a change is required.",
  },
] as const satisfies ReadonlyArray<AiSystemPromptSettingDefinition>;

export function getAiSystemPromptPreferenceKey(task: AiTaskId): AiSystemPromptPreferenceKey | null {
  return AI_TASK_SYSTEM_PROMPT_PREFERENCE_KEYS[task] ?? null;
}

export function normalizeAiSystemPrompt(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function buildAdditionalAiSystemPrompt(value: string | null | undefined): string | null {
  const normalizedPrompt = normalizeAiSystemPrompt(value);
  if (!normalizedPrompt) {
    return null;
  }

  return [
    "Additional user instructions for this Dispatch feature:",
    normalizedPrompt,
    "",
    "Treat these as supplemental guidance. Follow them when they do not conflict with earlier system instructions, required output formats, or the provided task context.",
  ].join("\n");
}
