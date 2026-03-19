import { contextBridge, ipcRenderer } from "electron";

import { BADGE_COUNT_CHANNEL, IPC_CHANNEL } from "../shared/ipc";

/**
 * Expose a minimal, safe API to the renderer process.
 * Access via `window.api`.
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Call a typed IPC method on the main process.
   */
  invoke(method: string, args: unknown): Promise<unknown> {
    return ipcRenderer.invoke(IPC_CHANNEL, { method, args });
  },

  /**
   * Update the dock badge count (macOS).
   */
  setBadgeCount(count: number): void {
    if (typeof count !== "number" || !Number.isInteger(count) || count < 0) {
      return;
    }
    ipcRenderer.send(BADGE_COUNT_CHANNEL, count);
  },
});
