import { usePreference } from "@/renderer/hooks/preferences/use-preference";
import {
  getSearchStateStorageKey,
  isSearchStatePersistenceEnabled,
  SEARCH_STATE_PERSISTENCE_PREFERENCE_KEY,
} from "@/shared/search-state";
import { useCallback, useEffect, useMemo, useState } from "react";

function readStoredSearchQuery(key: string): string {
  try {
    return globalThis.localStorage.getItem(key) ?? "";
  } catch {
    return "";
  }
}

function writeStoredSearchQuery(key: string, value: string): void {
  try {
    if (value.length === 0) {
      globalThis.localStorage.removeItem(key);
      return;
    }

    globalThis.localStorage.setItem(key, value);
  } catch {}
}

export function usePersistedSearchQuery(scope: string) {
  const preference = usePreference(SEARCH_STATE_PERSISTENCE_PREFERENCE_KEY);
  const persistenceEnabled = isSearchStatePersistenceEnabled(preference);
  const storageKey = useMemo(() => getSearchStateStorageKey(scope), [scope]);
  const [searchQuery, setSearchQueryState] = useState("");

  useEffect(() => {
    if (!persistenceEnabled) {
      writeStoredSearchQuery(storageKey, "");
      setSearchQueryState("");
      return;
    }

    setSearchQueryState(readStoredSearchQuery(storageKey));
  }, [persistenceEnabled, storageKey]);

  const setSearchQuery = useCallback(
    (value: string) => {
      setSearchQueryState(value);
      if (persistenceEnabled) {
        writeStoredSearchQuery(storageKey, value);
      }
    },
    [persistenceEnabled, storageKey],
  );

  return {
    persistenceEnabled,
    searchQuery,
    setSearchQuery,
  };
}
