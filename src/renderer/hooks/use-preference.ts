import { useQuery } from "@tanstack/react-query";

import { ipc } from "../lib/ipc";

/**
 * Read a single preference value from the database.
 * Returns null while loading or if the key is unset.
 */
export function usePreference(key: string): string | null {
  const query = useQuery({
    queryKey: ["preferences", key],
    queryFn: async () => {
      const result = await ipc("preferences.get", { key });
      return result ?? null;
    },
    staleTime: 60_000,
  });
  return query.data ?? null;
}
