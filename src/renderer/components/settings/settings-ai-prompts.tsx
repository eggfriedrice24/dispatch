import { cn } from "@/lib/utils";
import {
  AI_SYSTEM_PROMPT_SETTINGS,
  normalizeAiSystemPrompt,
} from "@/shared/ai-system-prompt-settings";

export function AiSystemPromptsSection({
  prefs,
  savePref,
}: {
  prefs: Record<string, string | null>;
  savePref: (key: string, value: string) => void;
}) {
  return (
    <section className="mt-8">
      <h3 className="text-text-primary text-sm font-medium">Additional System Prompts</h3>
      <p className="text-text-tertiary mt-0.5 text-xs">
        Add feature-specific instructions on top of Dispatch&apos;s built-in AI prompts. Required
        output formats still take precedence. Save with blur or Ctrl/Cmd+Enter.
      </p>
      <div className="border-border mt-3 overflow-hidden rounded-xl border bg-[radial-gradient(circle_at_top_left,rgba(212,136,58,0.05),transparent_44%)] shadow-sm">
        {AI_SYSTEM_PROMPT_SETTINGS.map((definition, index) => {
          const savedValue = prefs[definition.preferenceKey] ?? "";
          const hasCustomPrompt = normalizeAiSystemPrompt(savedValue) !== null;

          return (
            <div
              key={`${definition.preferenceKey}:${savedValue}`}
              className={cn(index > 0 && "border-border border-t", "px-5 py-5")}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="text-text-primary text-[13px] font-semibold tracking-[-0.01em]">
                      {definition.label}
                    </h4>
                    {hasCustomPrompt && (
                      <span className="rounded-full border border-[--border-accent] bg-[--accent-muted] px-2 py-0.5 font-mono text-[9px] font-semibold tracking-[0.08em] text-[--accent-text] uppercase">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-text-secondary mt-1 max-w-2xl text-[11px] leading-[1.6]">
                    {definition.description}
                  </p>
                </div>
              </div>
              <textarea
                aria-label={`${definition.label} additional system prompt`}
                autoComplete="off"
                defaultValue={savedValue}
                name={definition.preferenceKey}
                onBlur={(event) => {
                  const nextValue = event.currentTarget.value;
                  if (nextValue === savedValue) {
                    return;
                  }

                  savePref(definition.preferenceKey, nextValue.trim().length > 0 ? nextValue : "");
                }}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.currentTarget.blur();
                  }
                }}
                placeholder={definition.placeholder}
                rows={4}
                spellCheck={false}
                className="border-border bg-bg-root text-text-primary placeholder:text-text-tertiary mt-3 min-h-[116px] w-full resize-y rounded-lg border px-3 py-2.5 font-mono text-[11px] leading-[1.6] shadow-sm transition-colors outline-none focus:border-[--border-accent]"
              />
              <p className="text-text-ghost mt-2 text-[10px] leading-[1.5]">
                Leave blank to use Dispatch defaults for this workflow.
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
