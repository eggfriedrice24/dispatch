import type { HandlerMap } from "./ipc-handlers/types";

/* eslint-disable import/max-dependencies -- IPC registration intentionally composes per-domain handler maps in one place. */
import { ipcMain } from "electron";

import { IPC_CHANNEL, type IpcMethod } from "../shared/ipc";
import { aiHandlers } from "./ipc-handlers/ai";
import { appHandlers } from "./ipc-handlers/app";
import { environmentHandlers } from "./ipc-handlers/environment";
import { gitHandlers } from "./ipc-handlers/git";
import { insightsHandlers } from "./ipc-handlers/insights";
import { notificationHandlers } from "./ipc-handlers/notifications";
import { pullRequestHandlers } from "./ipc-handlers/pull-requests";
import { reviewHandlers } from "./ipc-handlers/review";
import { workflowHandlers } from "./ipc-handlers/workflows";
import { workspaceHandlers } from "./ipc-handlers/workspace";

const handlers: HandlerMap = {
  ...appHandlers,
  ...environmentHandlers,
  ...workspaceHandlers,
  ...pullRequestHandlers,
  ...gitHandlers,
  ...workflowHandlers,
  ...reviewHandlers,
  ...insightsHandlers,
  ...aiHandlers,
  ...notificationHandlers,
};

/**
 * Register the IPC handler. Call once on app startup.
 */
export function registerIpcHandler(): void {
  ipcMain.handle(IPC_CHANNEL, async (_event, payload: { method: string; args: unknown }) => {
    const { method, args } = payload;
    const handler = handlers[method as IpcMethod];

    if (!handler) {
      return { ok: false, error: `Unknown method: ${method}` };
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const result = await (handler as any)(args);
      return { ok: true, data: result ?? null };
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`[IPC] ${method} failed:`, error);
      return {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}
