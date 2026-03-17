import type { AppRouter } from "../../main/trpc/router";
import type { TRPCLink } from "@trpc/client";

import { QueryClient } from "@tanstack/react-query";
import { createTRPCClient } from "@trpc/client";
import { observable } from "@trpc/server/observable";
import { createTRPCOptionsProxy } from "@trpc/tanstack-react-query";
import superjson from "superjson";

/**
 * Custom tRPC link that routes calls through Electron's IPC bridge
 * instead of HTTP. The preload script exposes `window.api.trpc()`.
 */
function ipcLink(): TRPCLink<AppRouter> {
  return () =>
    ({ op }) =>
      observable((observer) => {
        const { type, path, input } = op;

        window.api
          .trpc({ type, path, input: superjson.serialize(input) })
          .then((response) => {
            const res = response as { result: { data: unknown } } | { error: { shape: unknown } };

            if ("error" in res) {
              observer.error(res.error.shape);
            } else {
              const data = superjson.deserialize(
                res.result.data as { json: unknown; meta?: unknown },
              );
              observer.next({ result: { type: "data", data } });
              observer.complete();
            }
          })
          .catch((err) => {
            observer.error(err);
          });
      });
}

/**
 * Singleton QueryClient for the renderer process.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

/**
 * tRPC vanilla client using the IPC link.
 */
export const trpcClient = createTRPCClient<AppRouter>({
  links: [ipcLink()],
});

/**
 * tRPC + TanStack React Query integration.
 * Use `trpc.someRouter.someQuery.queryOptions(input)` with `useQuery()`.
 */
export const trpc = createTRPCOptionsProxy<AppRouter>({
  client: trpcClient,
  queryClient,
});
