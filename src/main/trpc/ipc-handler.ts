import { ipcMain } from "electron";

import { callTRPCProcedure, getTRPCErrorShape } from "@trpc/server";
import type { AnyTRPCRouter } from "@trpc/server";
import superjson from "superjson";

import { TRPC_IPC_CHANNEL } from "../../shared/ipc";

/**
 * Register the tRPC IPC handler on the main process.
 *
 * The renderer sends { type, path, input } over ipcMain.handle,
 * and we call the corresponding tRPC procedure directly.
 */
export function registerTrpcIpcHandler(router: AnyTRPCRouter): void {
  ipcMain.handle(
    TRPC_IPC_CHANNEL,
    async (_event, payload: { type: "query" | "mutation"; path: string; input: unknown }) => {
      const { type, path, input } = payload;

      try {
        const result = await callTRPCProcedure({
          procedures: router._def.procedures,
          path,
          getRawInput: async () => input,
          type,
          ctx: {},
        });

        return {
          result: { type: "data" as const, data: superjson.serialize(result) },
        };
      } catch (error) {
        const shape = getTRPCErrorShape({
          config: router._def._config,
          error: error as Error,
          type,
          path,
          input,
          ctx: {},
        });

        return {
          error: { type: "error" as const, shape },
        };
      }
    },
  );
}
