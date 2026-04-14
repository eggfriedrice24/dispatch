import { trackPage } from "@/renderer/lib/app/posthog";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

/**
 * Simple state-based client-side router.
 *
 * Tracks the previous non-settings route so the settings icon
 * can toggle back to where you came from.
 */

export type Route =
  | { view: "review"; prNumber: number | null }
  | { view: "workflows"; runId?: number; fromPr?: number }
  | { view: "metrics" }
  | { view: "releases" }
  | { view: "settings" };

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
  /** Navigate to settings, or back to the previous view if already on settings. */
  toggleSettings: () => void;
}

const ROUTER_INITIAL_ROUTE: Route = { view: "review", prNumber: null };

const RouterContext = createContext<RouterContextValue>({
  route: ROUTER_INITIAL_ROUTE,
  navigate: () => {},
  toggleSettings: () => {},
});

interface RouterProviderProps {
  children: ReactNode;
  initialRoute?: Route;
}

export function RouterProvider({
  children,
  initialRoute = ROUTER_INITIAL_ROUTE,
}: RouterProviderProps) {
  const [route, setRoute] = useState<Route>(initialRoute);
  const previousRoute = useRef<Route>(initialRoute);

  const navigate = useCallback((next: Route) => {
    setRoute((current) => {
      if (current.view !== "settings") {
        previousRoute.current = current;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    trackPage(route.view);
  }, [route.view]);

  const toggleSettings = useCallback(() => {
    setRoute((current) => {
      if (current.view === "settings") {
        // Go back to previous view, fall back to home if no valid history
        const prev = previousRoute.current;
        return prev.view === "settings"
          ? { view: "review", prNumber: null }
          : prev;
      }
      // Going to settings — save current route
      previousRoute.current = current;
      return { view: "settings" };
    });
  }, []);

  return (
    <RouterContext.Provider value={{ route, navigate, toggleSettings }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  return useContext(RouterContext);
}
