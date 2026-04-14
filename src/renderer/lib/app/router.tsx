import { trackPage } from "@/renderer/lib/app/posthog";
import { create } from "zustand";
import { useShallow } from "zustand/react/shallow";

export type Route =
  | { view: "review"; prNumber: number | null }
  | { view: "workflows"; runId?: number; fromPr?: number }
  | { view: "metrics" }
  | { view: "releases" }
  | { view: "settings" };

interface RouterState {
  route: Route;
  navigate: (route: Route) => void;
  toggleSettings: () => void;
  reset: (route: Route) => void;
}

let previousRoute: Route = { view: "review", prNumber: null };

export const useRouterStore = create<RouterState>()((set, get) => ({
  route: { view: "review", prNumber: null } as Route,

  navigate: (next) => {
    const current = get().route;
    if (current.view !== "settings") {
      previousRoute = current;
    }
    set({ route: next });
    if (next.view !== current.view) {
      trackPage(next.view);
    }
  },

  toggleSettings: () => {
    const current = get().route;
    if (current.view === "settings") {
      const prev = previousRoute;
      const next: Route = prev.view === "settings" ? { view: "review", prNumber: null } : prev;
      set({ route: next });
      trackPage(next.view);
    } else {
      previousRoute = current;
      set({ route: { view: "settings" } });
      trackPage("settings");
    }
  },

  reset: (route) => {
    previousRoute = { view: "review", prNumber: null };
    set({ route });
    trackPage(route.view);
  },
}));

export function useRouter() {
  return useRouterStore(useShallow((s) => s));
}
