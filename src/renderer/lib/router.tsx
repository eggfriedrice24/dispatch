import type { ReactNode } from "react";

import { createContext, useCallback, useContext, useState } from "react";

/**
 * Simple state-based client-side router.
 *
 * No external dependency — just React context + state.
 */

export type Route =
  | { view: "review"; prNumber: number | null }
  | { view: "workflows" }
  | { view: "settings" };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue>({
  route: { view: "review", prNumber: null },
  navigate: () => {},
});

export function RouterProvider({ children }: { children: ReactNode }) {
  const [route, setRoute] = useState<Route>({ view: "review", prNumber: null });

  const navigate = useCallback((next: Route) => {
    setRoute(next);
  }, []);

  return <RouterContext.Provider value={{ route, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter() {
  return useContext(RouterContext);
}
