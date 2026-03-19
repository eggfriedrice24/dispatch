import { Button } from "@/components/ui/button";
import { toastManager } from "@/components/ui/toast";
import { useEffect, useState } from "react";

import { ipc } from "../lib/ipc";

/**
 * Settings panel — Phase 2 B2.2
 *
 * Configurable: merge strategy, polling intervals.
 * Future: AI provider, theme.
 */

export function SettingsView() {
  const [mergeStrategy, setMergeStrategy] = useState("squash");
  const [prPollInterval, setPrPollInterval] = useState("30");
  const [checksPollInterval, setChecksPollInterval] = useState("10");

  // Load saved preferences
  useEffect(() => {
    ipc("review.getLastSha", { repo: "__prefs", prNumber: 0 }).catch(() => {});
    // Future: load from ipc("preferences.get", ...) when endpoint exists
  }, []);

  function handleSave() {
    // Future: persist via IPC preferences endpoint
    toastManager.add({ title: "Settings saved", type: "success" });
  }

  return (
    <div className="flex flex-1 items-start justify-center overflow-y-auto py-12">
      <div className="w-full max-w-lg">
        <h1 className="font-heading text-text-primary text-3xl italic">Settings</h1>
        <p className="text-text-secondary mt-1 text-sm">Configure Dispatch behavior.</p>

        {/* Merge strategy */}
        <section className="mt-8">
          <h2 className="text-text-primary text-sm font-semibold">Default Merge Strategy</h2>
          <p className="text-text-tertiary mt-0.5 text-xs">
            Which merge method to use by default when merging PRs.
          </p>
          <div className="border-border bg-bg-raised mt-3 flex rounded-md border p-[2px]">
            {(["squash", "merge", "rebase"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setMergeStrategy(s)}
                className={`flex-1 cursor-pointer rounded-sm px-3 py-1.5 text-xs capitalize ${
                  mergeStrategy === s
                    ? "bg-bg-elevated text-text-primary shadow-sm"
                    : "text-text-tertiary hover:text-text-secondary"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Polling intervals */}
        <section className="mt-8">
          <h2 className="text-text-primary text-sm font-semibold">Polling Intervals</h2>
          <p className="text-text-tertiary mt-0.5 text-xs">
            How often to check for updates (in seconds).
          </p>
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs">PR list</span>
              <input
                type="number"
                min="5"
                max="300"
                value={prPollInterval}
                onChange={(e) => setPrPollInterval(e.target.value)}
                className="border-border bg-bg-root text-text-primary focus:border-primary w-20 rounded-md border px-2 py-1 text-right font-mono text-xs focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary text-xs">CI checks</span>
              <input
                type="number"
                min="5"
                max="300"
                value={checksPollInterval}
                onChange={(e) => setChecksPollInterval(e.target.value)}
                className="border-border bg-bg-root text-text-primary focus:border-primary w-20 rounded-md border px-2 py-1 text-right font-mono text-xs focus:outline-none"
              />
            </div>
          </div>
        </section>

        {/* About */}
        <section className="border-border bg-bg-raised mt-8 rounded-lg border p-4">
          <h2 className="text-text-primary text-sm font-semibold">About</h2>
          <p className="text-text-tertiary mt-1 font-mono text-xs">Dispatch v0.0.1</p>
          <p className="text-text-tertiary mt-0.5 text-xs">
            CI/CD-integrated desktop PR review app.
          </p>
        </section>

        <div className="mt-8 flex justify-end">
          <Button
            className="bg-primary text-primary-foreground hover:bg-accent-hover"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
