import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { ipc } from "./ipc";

type Theme = "dark" | "light" | "system";
type ResolvedTheme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  resolvedTheme: "dark",
  setTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  return globalThis.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveTheme(theme: Theme): ResolvedTheme {
  return theme === "system" ? getSystemTheme() : theme;
}

function applyTheme(resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove("dark", "light");
  root.classList.add(resolved);
  root.style.colorScheme = resolved;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem("dispatch-theme") as Theme) ?? "dark";
  });

  const resolved = resolveTheme(theme);

  // Apply theme class on changes
  useEffect(() => {
    applyTheme(resolved);
  }, [resolved]);

  // Load authoritative value from SQLite preferences on mount
  useEffect(() => {
    ipc("preferences.get", { key: "theme" }).then((saved) => {
      if (saved && saved !== theme) {
        setThemeState(saved as Theme);
        localStorage.setItem("dispatch-theme", saved);
        applyTheme(resolveTheme(saved as Theme));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  // Listen for system theme changes when preference is "system"
  useEffect(() => {
    if (theme !== "system") return;
    const mq = globalThis.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme(resolveTheme("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("dispatch-theme", newTheme);
    applyTheme(resolveTheme(newTheme));
    ipc("preferences.set", { key: "theme", value: newTheme });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme: resolved, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
