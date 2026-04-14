import { Switch } from "@/components/ui/switch";
import {
  EXPERIMENTAL_FEATURES,
  isExperimentalFeatureEnabled,
} from "@/shared/experimental-features";

interface ExperimentalSettingsSectionProps {
  prefs: Record<string, string | null | undefined>;
  savePref: (key: string, value: string) => void;
}

export function ExperimentalSettingsSection({ prefs, savePref }: ExperimentalSettingsSectionProps) {
  return (
    <>
      <h2 className="text-text-primary text-base font-semibold">Experimental</h2>
      <p className="text-text-tertiary mt-0.5 text-xs">
        Features we are still shaping. They may change or disappear between releases.
      </p>

      <section className="mt-6">
        <h3 className="text-text-primary text-sm font-medium">Feature Flags</h3>
        <p className="text-text-tertiary mt-0.5 text-xs">
          Turn on previews of upcoming features. Expect rough edges.
        </p>
        <div className="mt-3 flex flex-col gap-1">
          {EXPERIMENTAL_FEATURES.map((feature) => (
            <label
              key={feature.key}
              className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 hover:bg-[--bg-elevated]"
            >
              <div>
                <span className="text-text-secondary text-xs">{feature.label}</span>
                <p className="text-text-ghost mt-0.5 text-[10px] leading-4">
                  {feature.description}
                </p>
              </div>
              <Switch
                checked={isExperimentalFeatureEnabled(prefs[feature.key])}
                onCheckedChange={(checked) => savePref(feature.key, checked ? "true" : "false")}
                aria-label={`Toggle ${feature.label}`}
              />
            </label>
          ))}
        </div>
      </section>
    </>
  );
}
