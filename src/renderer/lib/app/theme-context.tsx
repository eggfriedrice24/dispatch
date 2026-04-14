import { ipc } from "@/renderer/lib/app/ipc";
import {
  DEFAULT_CODE_THEME_DARK,
  DEFAULT_CODE_THEME_LIGHT,
} from "@/renderer/lib/review/highlighter";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type ThemeStyle = "default" | "neo-brutalism";
export type ColorMode = "dark" | "oled" | "light" | "system";
type ResolvedTheme = "dark" | "light";

const LEGACY_THEME_STORAGE_KEY = "dispatch-theme";
const STYLE_STORAGE_KEY = "dispatch-theme-style";
const MODE_STORAGE_KEY = "dispatch-color-mode";
const LEGACY_SINGLE_CODE_THEME_STORAGE_KEY = "dispatch-code-theme";
const LEGACY_SINGLE_CODE_THEME_PREFERENCE_KEY = "codeTheme";

function readCodeThemePreference(storageKey: string, fallback: string): string {
  return localStorage.getItem(storageKey) ?? fallback;
}

/** Migrate old single `theme` value to split style + mode. */
function migrateOldTheme(old: string): { style: ThemeStyle; mode: ColorMode } {
  switch (old) {
    case "light":
      return { style: "default", mode: "light" };
    case "system":
      return { style: "default", mode: "system" };
    case "oled":
      return { style: "default", mode: "oled" };
    case "neo-brutal-dark":
      return { style: "neo-brutalism", mode: "dark" };
    case "neo-brutal-light":
      return { style: "neo-brutalism", mode: "light" };
    case "neo-brutal-oled":
      return { style: "neo-brutalism", mode: "oled" };
    default:
      return { style: "default", mode: "dark" };
  }
}

interface ThemeContextValue {
  themeStyle: ThemeStyle;
  colorMode: ColorMode;
  resolvedTheme: ResolvedTheme;
  setThemeStyle: (style: ThemeStyle) => void;
  setColorMode: (mode: ColorMode) => void;
  codeTheme: string;
  codeThemeLight: string;
  codeThemeDark: string;
  setCodeTheme: (theme: string) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeStyle: "default",
  colorMode: "dark",
  resolvedTheme: "dark",
  setThemeStyle: () => {},
  setColorMode: () => {},
  codeTheme: DEFAULT_CODE_THEME_DARK,
  codeThemeDark: DEFAULT_CODE_THEME_DARK,
  codeThemeLight: DEFAULT_CODE_THEME_LIGHT,
  setCodeTheme: () => {},
});

function getSystemTheme(): ResolvedTheme {
  return globalThis.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function resolveMode(mode: ColorMode): ResolvedTheme {
  if (mode === "system") return getSystemTheme();
  if (mode === "oled") return "dark";
  return mode;
}

/** Map (style, mode) → the CSS class applied to <html>. */
function deriveThemeClass(style: ThemeStyle, mode: ColorMode, resolved: ResolvedTheme): string {
  const isOled = mode === "oled";
  if (style === "neo-brutalism") {
    if (isOled) return "neo-brutal-oled";
    return resolved === "dark" ? "neo-brutal-dark" : "neo-brutal-light";
  }
  // "default"
  if (isOled) return "oled";
  return resolved; // "dark" | "light"
}

const ALL_THEME_CLASSES = [
  "dark",
  "light",
  "oled",
  "neo-brutal-dark",
  "neo-brutal-light",
  "neo-brutal-oled",
];

function applyTheme(style: ThemeStyle, mode: ColorMode, resolved: ResolvedTheme) {
  const root = document.documentElement;
  root.classList.remove(...ALL_THEME_CLASSES);
  root.classList.add(deriveThemeClass(style, mode, resolved));
  root.style.colorScheme = resolved;
}

/** Read initial values from localStorage, migrating from old key if needed. */
function readInitialValues(): { style: ThemeStyle; mode: ColorMode } {
  const savedStyle = localStorage.getItem(STYLE_STORAGE_KEY) as ThemeStyle | null;
  const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as ColorMode | null;
  if (savedStyle && savedMode) {
    return { style: savedStyle, mode: savedMode };
  }
  // Migrate from old single key
  const oldTheme = localStorage.getItem(LEGACY_THEME_STORAGE_KEY);
  if (oldTheme) {
    const migrated = migrateOldTheme(oldTheme);
    localStorage.setItem(STYLE_STORAGE_KEY, migrated.style);
    localStorage.setItem(MODE_STORAGE_KEY, migrated.mode);
    return migrated;
  }
  return { style: "default", mode: "dark" };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const initial = readInitialValues();
  const [themeStyle, setThemeStyleState] = useState<ThemeStyle>(initial.style);
  const [colorMode, setColorModeState] = useState<ColorMode>(initial.mode);
  const [codeThemeDark, setCodeThemeDark] = useState<string>(() =>
    readCodeThemePreference(
      "dispatch-code-theme-dark",
      localStorage.getItem(LEGACY_SINGLE_CODE_THEME_STORAGE_KEY) ?? DEFAULT_CODE_THEME_DARK,
    ),
  );
  const [codeThemeLight, setCodeThemeLight] = useState<string>(() =>
    readCodeThemePreference(
      "dispatch-code-theme-light",
      localStorage.getItem(LEGACY_SINGLE_CODE_THEME_STORAGE_KEY) ?? DEFAULT_CODE_THEME_LIGHT,
    ),
  );

  const resolved = resolveMode(colorMode);
  const codeTheme = resolved === "light" ? codeThemeLight : codeThemeDark;

  // Apply theme class on changes
  useEffect(() => {
    applyTheme(themeStyle, colorMode, resolved);
  }, [themeStyle, colorMode, resolved]);

  // Load authoritative values from SQLite preferences on mount
  useEffect(() => {
    ipc("preferences.getAll", {
      keys: [
        "themeStyle",
        "colorMode",
        "theme", // legacy
        "codeThemeDark",
        "codeThemeLight",
        LEGACY_SINGLE_CODE_THEME_PREFERENCE_KEY,
      ],
    }).then((prefs) => {
      // Theme style + color mode
      if (prefs.themeStyle && prefs.colorMode) {
        const dbStyle = prefs.themeStyle as ThemeStyle;
        const dbMode = prefs.colorMode as ColorMode;
        if (dbStyle !== themeStyle || dbMode !== colorMode) {
          setThemeStyleState(dbStyle);
          setColorModeState(dbMode);
          localStorage.setItem(STYLE_STORAGE_KEY, dbStyle);
          localStorage.setItem(MODE_STORAGE_KEY, dbMode);
          applyTheme(dbStyle, dbMode, resolveMode(dbMode));
        }
      } else if (prefs.theme) {
        // Migrate old single theme pref to split
        const migrated = migrateOldTheme(prefs.theme);
        setThemeStyleState(migrated.style);
        setColorModeState(migrated.mode);
        localStorage.setItem(STYLE_STORAGE_KEY, migrated.style);
        localStorage.setItem(MODE_STORAGE_KEY, migrated.mode);
        applyTheme(migrated.style, migrated.mode, resolveMode(migrated.mode));
        ipc("preferences.set", { key: "themeStyle", value: migrated.style });
        ipc("preferences.set", { key: "colorMode", value: migrated.mode });
      }

      // Code themes
      const savedDark = prefs.codeThemeDark;
      if (savedDark) {
        setCodeThemeDark(savedDark);
        localStorage.setItem("dispatch-code-theme-dark", savedDark);
      }
      const savedLight = prefs.codeThemeLight;
      if (savedLight) {
        setCodeThemeLight(savedLight);
        localStorage.setItem("dispatch-code-theme-light", savedLight);
      }
      if (!savedDark && !savedLight && prefs.codeTheme) {
        setCodeThemeDark(prefs.codeTheme);
        setCodeThemeLight(prefs.codeTheme);
        localStorage.setItem("dispatch-code-theme-dark", prefs.codeTheme);
        localStorage.setItem("dispatch-code-theme-light", prefs.codeTheme);
        ipc("preferences.set", { key: "codeThemeDark", value: prefs.codeTheme });
        ipc("preferences.set", { key: "codeThemeLight", value: prefs.codeTheme });
        localStorage.removeItem(LEGACY_SINGLE_CODE_THEME_STORAGE_KEY);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  }, []);

  // Listen for system theme changes when mode is "system"
  useEffect(() => {
    if (colorMode !== "system") {
      return;
    }
    const mq = globalThis.matchMedia("(prefers-color-scheme: light)");
    const handler = () => applyTheme(themeStyle, "system", resolveMode("system"));
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [colorMode, themeStyle]);

  const setThemeStyle = useCallback((newStyle: ThemeStyle) => {
    setThemeStyleState(newStyle);
    localStorage.setItem(STYLE_STORAGE_KEY, newStyle);
    ipc("preferences.set", { key: "themeStyle", value: newStyle });
  }, []);

  const setColorMode = useCallback(
    (newMode: ColorMode) => {
      setColorModeState(newMode);
      localStorage.setItem(MODE_STORAGE_KEY, newMode);
      applyTheme(themeStyle, newMode, resolveMode(newMode));
      ipc("preferences.set", { key: "colorMode", value: newMode });
    },
    [themeStyle],
  );

  const setCodeTheme = useCallback(
    (newCodeTheme: string) => {
      if (resolved === "light") {
        setCodeThemeLight(newCodeTheme);
        localStorage.setItem("dispatch-code-theme-light", newCodeTheme);
        ipc("preferences.set", { key: "codeThemeLight", value: newCodeTheme });
      } else {
        setCodeThemeDark(newCodeTheme);
        localStorage.setItem("dispatch-code-theme-dark", newCodeTheme);
        ipc("preferences.set", { key: "codeThemeDark", value: newCodeTheme });
      }
    },
    [resolved],
  );

  return (
    <ThemeContext.Provider
      value={{
        themeStyle,
        colorMode,
        resolvedTheme: resolved,
        setThemeStyle,
        setColorMode,
        codeTheme,
        codeThemeLight,
        codeThemeDark,
        setCodeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
